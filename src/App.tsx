import { useEffect, useState } from 'react';
import { gps } from 'exifr';
import { AdvancedMarker, APIProvider, Map, MapCameraChangedEvent, Pin } from '@vis.gl/react-google-maps';
import './App.css'

const _URLS:string[] = ["0.jpg", "1.jpg", "2.jpg"]; 

interface GPSInfo {
  image: string;
  gps: {lat:number,long:number};
}

//map api key: AIzaSyA0XFbVGVO7sd0FGQFDmtzO7ZgFrenMWbA

function App() {
  const [imageUrl,setImageUrl] = useState(_URLS[0]);
  const [imageData, setImageData] = useState<GPSInfo[]>();//for active image

  useEffect(() => {
    let coords:GPSInfo[] = [];
    async function processFiles() {
      await Promise.all(_URLS.map(async item => {
        let data = await gps(item);
        coords.push({image:item, gps:{lat:data.latitude,long:data.longitude}});
      }));

      setImageData(coords);
      console.log('done: '+coords[0].gps);
      if(imageData!==undefined){
        console.log('done: '+imageData[0].gps);
      }
    }
    processFiles();
  },[]);

  return (
    <>
      <div className="container">
        <div className="image">
          <img id="photo" src={imageUrl} alt='image' />
        </div>
        {imageData !== undefined && (
          <div className="card">          
              {_URLS.map((item, i) => {
                return <button key={i} onClick={()=>setImageUrl(item)}>Image {i}</button>
              })}            
              <div>
                {imageData.map((item, i) => 
                  <li key={i}>Coords: lat: {item.gps.lat}, long: {item.gps.long}</li>
                )}
              </div>
              <APIProvider apiKey={'AIzaSyA0XFbVGVO7sd0FGQFDmtzO7ZgFrenMWbA'} onLoad={() => console.log('Maps API has loaded.')}>
                  <Map 
                      defaultZoom={13}
                      defaultCenter={ { lat: imageData[0].gps.lat, lng: imageData[0].gps.long } }
                      onCameraChanged={ (ev: MapCameraChangedEvent) => console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)
                      }>
                  </Map>    
              </APIProvider>
          </div>
        )}
      </div>
    </>
  )
}

export default App
