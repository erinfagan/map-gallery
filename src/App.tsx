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

import { AdvancedMarker, APIProvider, InfoWindow, Map, MapCameraChangedEvent, Pin, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
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
-change selected marker color on map
-change selected point on chart
-display extra info
  -total elevation gain-loss
  -total distance travelled (GoogleAPI request)
B--------
-move photos to S3
-store relevant EXIF data in AWS table
*/

function App() {
  const [activeImage,setActiveImage] = useState(_URLS[0]);
  const [mapData, setmapData] = useState<GPSInfo[]>();

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
                      {mapData.map((item: GPSInfo) => (
                        <MarkerWithInfo item={item} handleClick={setActiveImage}/>
                      ))}
                </Map> 
              </APIProvider>   
            </div>
            <div className="chart">           
              <LineChart data={mapData} handleClick={setActiveImage} />              
            </div>
          </>
        )}
      </div>
    </>
  )
}

const LineChart = (props:{data: GPSInfo[], handleClick: (which:string) => void}) => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState();

  //set data
  useEffect(() => {
    const chart = chartRef.current;
    if(!chart) return;
    //setChartData

  },[]);

  const options = {
    responsive: true,
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

//display info per click, date, altitude, distance/altitude gain-loss from previous
const MarkerWithInfo = (props: {item: GPSInfo, handleClick: (which:string) => void }) => {
  const [markerRef,marker] = useAdvancedMarkerRef();
  const [infoVisible, setInfoVisible] = useState(false);

  const handleMarkerClick = useCallback(() => {
    props.handleClick(props.item.image);
    setInfoVisible(!infoVisible);
  },[]);

  const handleInfoClose = useCallback(() => setInfoVisible(false),[]);

  return (
    <>
      <AdvancedMarker key={props.item.image} ref={markerRef} position={props.item.location} title={props.item.image} onClick={()=>handleMarkerClick()}>
        <Pin background={'#d62111'} glyph={props.item.ind.toString()} glyphColor={'#FFF'} borderColor={'#7c170d'} />
      </AdvancedMarker>
      {infoVisible && (
        <InfoWindow className={'infoWindow'} anchor={marker} onClose={handleInfoClose}>
          <h2>Image {props.item.ind}</h2>
          <li>Day: {props.item.label}</li>
          <li>Elevation: {props.item.alt} meters</li>
        </InfoWindow>
      )}
    </>
  )
}

export default App
