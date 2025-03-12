import { useCallback, useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { parse } from 'exifr';
import { AdvancedMarker, AdvancedMarkerProps, APIProvider, InfoWindow, Map, Pin, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import './App.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const _GALLERY_LENGTH:number = 21;  

type GPSInfo = { ind:number, label:string, image: string, location: google.maps.LatLngLiteral, alt: number, cd: number };

function App() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [activeInd, setActiveInd] = useState(0);
  const [activeImage, setActiveImage] = useState("0.jpg");
  const [mapData, setmapData] = useState<GPSInfo[]>();

  const handleMarkerClick = useCallback((ind:number) => {
    setActiveInd(ind);
    setActiveImage(imageUrls[ind]);
  },[activeInd, imageUrls]);
//45.750525023927686, 6.807305637981733, alt: 2514
  useEffect(() => {
    let coords:GPSInfo[] = [];
    async function processFiles() {
      try {
        let allImages:string[] = [];
        for(let i:number=0; i<_GALLERY_LENGTH; i++){
          let imageUrl:string = `${i}.jpg`;
          allImages.push(imageUrl);
          let data = await parse(`/images/${imageUrl}`, {pick:['CreateDate', 'GPSLatitude', 'GPSLongitude', 'GPSAltitude'], reviveValues: true, translateKeys: true});
          let pos:google.maps.LatLngLiteral = {lat:data.latitude || 0,lng:data.longitude || 0};
          let picName = data.CreateDate instanceof Date ? data.CreateDate.toLocaleString('en-us', {weekday: 'short'}): imageUrl;
          coords.push({ind: i, label: picName, image:imageUrl, location:pos, alt: data.GPSAltitude, cd: data.CreateDate});
        }
        setImageUrls(allImages);
        coords.sort((a,b) => a.ind-b.ind);
        setmapData(coords);
      } catch (error) {
        console.error('image data failed: ', error);
      }
    }
    processFiles();
  },[]);

  return (
    <>
      <div className="container">
        <div className="image">
          <img id="photo" src={`/images/${activeImage}`} alt='image' />
        </div>
        {mapData !== undefined && (
          <>
            <div className="map center">                       
              <APIProvider apiKey={import.meta.env.VITE_GMAPS_KEY} onLoad={() => console.log('Maps API has loaded.')}>
                <Map                     
                    defaultZoom={10}
                    defaultCenter={ mapData[0].location }                      
                    mapId='85777689c84f7376'
                    mapTypeId={'terrain'}>
                      {mapData.map((item: GPSInfo) => (
                        <MarkerWithRef 
                          key={item.image}  
                          activeMarker={activeInd}
                          info={item}
                          position={item.location} 
                          title={item.image}  
                          markerClick={() => handleMarkerClick(item.ind)}>
                          <Pin background={'#d62111'} glyph={item.ind.toString()} glyphColor={'#FFF'} borderColor={'#7c170d'} />
                        </MarkerWithRef>
                      ))}
                </Map> 
              </APIProvider>   
            </div>
            <div className="chart center">           
              <LineChart data={mapData} activeIndex={activeInd} />              
            </div>
          </>
        )}
      </div>
    </>
  )
}

const LineChart = (props:{data: GPSInfo[], activeIndex: number}) => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      point: {
        radius:5
      }
    },
    plugins: {
      legend: {
        position: 'top' as const
      },
      title: {
        display: true,
        text: 'Elevation Change Per Photo (meters)'
      },
    }
  };
  
  const data = {
    labels: props.data.map((item) => item.image),
    datasets: [
      {
        label: 'Set 1',
        data: props.data.map((item) => item.alt),
        borderColor: 'rgb(18, 79, 201)',
        backgroundColor: 'rgba(201, 18, 201, 1)'
      }
    ]
  };

  return (
    <Line options={options} data={data} />
  )
}

const MarkerWithRef = (props: AdvancedMarkerProps & {activeMarker:number, info:GPSInfo, markerClick: () => void }) => {
  const [closedSelf, setClosedSelf] = useState(false);
  const {children, activeMarker, info, markerClick, ...advancedMarkerProps} = props;
  const [markerRef, marker] = useAdvancedMarkerRef();

  const handleClick = useCallback(() => {
    setClosedSelf(false);
    markerClick();
  },[]);

  const imActive = activeMarker === info.ind && !closedSelf;
  return (
    <>
      <AdvancedMarker 
        ref={markerRef} 
        onClick={()=>handleClick()}
        {...advancedMarkerProps}>
        {children}
      </AdvancedMarker>
      {imActive && (
          <InfoWindow className={'infoWindow'} anchor={marker} onCloseClick={()=>setClosedSelf(true)} shouldFocus={false}>
            <b>Image {info.ind}</b>
            <li>Day: {info.label}</li>
            <li>Elevation: {info.alt} meters</li>
          </InfoWindow>
      )}
    </>
  )
}

export default App
