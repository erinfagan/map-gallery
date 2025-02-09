import { useEffect, useState } from 'react';
import { gps } from 'exifr';
import './App.css'

const _URLS:string[] = ["0.jpg", "1.jpg", "2.jpg"]; 

interface GPSInfo {
  image: string;
  gps: {latitude:number,longitude:number};
}

function App() {
  const [imageUrl,setImageUrl] = useState(_URLS[0]);
  const [imageData, setImageData] = useState<GPSInfo[]>();//for active image
  //parse the list

  useEffect(() => {
    let coords:GPSInfo[] = [];
    async function getGPS(path:string){
      const data = await gps(path);
      //catch error
      coords.push({image:path, gps:data});
    }
    _URLS.forEach((path) => {
      getGPS(path);
    });
    setImageData(coords);
  },[]);

  return (
    <>
      <div className="container">
        <div className="image">
          <img id="photo" src={imageUrl} alt='image' />
        </div>
        <div className="card">
          {_URLS.map((item, i) => {
            return <button key={i} onClick={()=>setImageUrl(item)}>Image {i}</button>
          })
          }
          <div>
            {imageData && imageData.map((item) => 
              <li>Coords: lat: {item.gps.latitude}, long: {item.gps.longitude}</li>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
