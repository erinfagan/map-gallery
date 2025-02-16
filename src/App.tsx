import { useCallback, useEffect, useRef, useState } from 'react';
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

import { AdvancedMarker, AdvancedMarkerProps, APIProvider, InfoWindow, Map, MapCameraChangedEvent, Pin, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
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

const _URLS:string[] = ["0.jpg", "1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg"]; 

type GPSInfo = { ind:number, label:string, image: string, location: google.maps.LatLngLiteral, alt: number, cd: number };

/* 
A-------
-change selected point on chart
-display extra info
  -total elevation gain-loss
  -total distance travelled (GoogleAPI request)
B--------
-move photos to S3
-store relevant EXIF data in AWS table
*/

function App() {
  const [activeInd, setActiveInd] = useState(0);
  const [activeImage, setActiveImage] = useState(_URLS[0]);
  const [mapData, setmapData] = useState<GPSInfo[]>();

  const [selectedMarker, setSelectedMarker] = useState<google.maps.marker.AdvancedMarkerElement|null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  const handleMarkerClick = useCallback((id:number, marker?:google.maps.marker.AdvancedMarkerElement) => {
    setActiveInd(id);
    if(marker) setSelectedMarker(marker);
    if(id !== activeInd){
      setInfoVisible(true);
    }else{
      setInfoVisible(isVisible => !isVisible);
    }
    setActiveImage(_URLS[id]);
  },[activeInd]);

  const handleInfoClose = useCallback(() => {
    setInfoVisible(false)
  },[]);

  useEffect(() => {
    let coords:GPSInfo[] = [];
    async function processFiles() {
      await Promise.all(_URLS.map(async (item, i) => {
        let data = await parse(item, {pick:['CreateDate', 'GPSLatitude', 'GPSLongitude', 'GPSAltitude'], reviveValues: true, translateKeys: true});
        let pos:google.maps.LatLngLiteral = {lat:data.latitude,lng:data.longitude};
        let picName = data.CreateDate instanceof Date ? data.CreateDate.toLocaleString('en-us', {weekday: 'short'}): item;
        coords.push({ind: i, label: picName, image:item, location:pos, alt: data.GPSAltitude, cd: data.CreateDate});
      }));
      coords.sort((a,b) => a.ind-b.ind);
      setmapData(coords);
      if(mapData!==undefined){
        console.log('done: '+mapData[0].location);
      }
    }
    processFiles();
  },[]);

  return (
    <>
      <div className="container">
        <div className="image">
          <img id="photo" src={activeImage} alt='image' />
        </div>
        {mapData !== undefined && (
          <>
            <div className="map">                       
              <APIProvider apiKey={'AIzaSyA0XFbVGVO7sd0FGQFDmtzO7ZgFrenMWbA'} onLoad={() => console.log('Maps API has loaded.')}>
                <Map                     
                    defaultZoom={10}
                    defaultCenter={ mapData[0].location }                      
                    onCameraChanged={ (ev: MapCameraChangedEvent) => console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)}
                    mapId='85777689c84f7376'
                    mapTypeId={'terrain'}>
                      {mapData.map((item: GPSInfo, ind) => (
                        <MarkerWithRef 
                          key={ind}  
                          position={item.location} 
                          title={item.image}  
                          markerClick={(marker:google.maps.marker.AdvancedMarkerElement) => handleMarkerClick(item.ind,marker)}>
                          <Pin background={'#d62111'} glyph={item.ind.toString()} glyphColor={'#FFF'} borderColor={'#7c170d'} />
                        </MarkerWithRef>
                      ))}
                      {infoVisible && (
                        <InfoWindow className={'infoWindow'} anchor={selectedMarker} onCloseClick={handleInfoClose} shouldFocus={false}>
                          <b>Image {mapData[activeInd].ind}</b>
                          <li>Day: {mapData[activeInd].label}</li>
                          <li>Elevation: {mapData[activeInd].alt} meters</li>
                        </InfoWindow>
                      )}
                </Map> 
              </APIProvider>   
            </div>
            <div className="chart">           
              <LineChart data={mapData} handleClick={setActiveImage} activeIndex={activeInd} />              
            </div>
          </>
        )}
      </div>
    </>
  )
}

const LineChart = (props:{data: GPSInfo[], activeIndex: number, handleClick: (which:string) => void}) => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState();
  
  //set data
  useEffect(() => {
    const chart = chartRef.current;
    if(!chart) return;
    //update chart with active
  },[]);

  const options = {
    responsive: true,
    maintainAspectRation: false,
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
    <Line ref={chartRef} options={options} data={data} />
  )
}

const MarkerWithRef = (props: AdvancedMarkerProps & {markerClick: (marker:google.maps.marker.AdvancedMarkerElement) => void }) => {
  const {children, markerClick, ...advancedMarkerProps} = props;
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker 
        ref={markerRef} 
        onClick={()=>{
          if(marker) markerClick(marker)
        }}
        {...advancedMarkerProps}>
        {children}
      </AdvancedMarker>
    </>
  )
}

export default App
