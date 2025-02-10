import { useEffect, useState } from 'react';
import { parse } from 'exifr';
import { AdvancedMarker, APIProvider, Map, MapCameraChangedEvent, Pin } from '@vis.gl/react-google-maps';
import './App.css'

const _URLS:string[] = ["0.jpg", "1.jpg", "2.jpg"]; 

type GPSInfo = { image: string, location: google.maps.LatLngLiteral, alt: number }

function App() {
  const [imageUrl,setImageUrl] = useState(_URLS[0]);
  const [imageData, setImageData] = useState<GPSInfo[]>();//for active image

  useEffect(() => {
    let coords:GPSInfo[] = [];
    async function processFiles() {
      await Promise.all(_URLS.map(async item => {
        let data = await parse(item, {gps:true, translateKeys: true, translateValues:true});
        let pos:google.maps.LatLngLiteral = {lat:data.latitude,lng:data.longitude};
        coords.push({image:item, location:pos, alt: data.GPSAltitude});
      }));

      setImageData(coords);
      if(imageData!==undefined){
        console.log('done: '+imageData[0].location);
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
              <APIProvider apiKey={'AIzaSyA0XFbVGVO7sd0FGQFDmtzO7ZgFrenMWbA'} onLoad={() => console.log('Maps API has loaded.')}>
                  <Map 
                      defaultZoom={10}
                      defaultCenter={ imageData[0].location }                      
                      onCameraChanged={ (ev: MapCameraChangedEvent) => console.log('camera changed:', ev.detail.center, 'zoom:', ev.detail.zoom)}
                      mapId='85777689c84f7376'
                      mapTypeId={'terrain'}>
                      <PoiMarkers pois={imageData} handleClick={setImageUrl}/>
                  </Map> 
              </APIProvider>
          </div>
        )}
      </div>
    </>
  )
}

const PoiMarkers = (props: {pois: GPSInfo[], handleClick: (which:string) => void }) => {
  return (
    <>
    {props.pois.map((poi: GPSInfo) => (
      <AdvancedMarker key={poi.image} position={poi.location} title={poi.image} onClick={()=>props.handleClick(poi.image)}>
        <Pin background={'#FBBC04'} glyphColor={'#000'}borderColor={'#000'} />
      </AdvancedMarker>
    ))}
    </>
  )
}

export default App
