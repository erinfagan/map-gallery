import { useCallback, useEffect, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { LineChart } from '@mui/x-charts/LineChart';
import { parse } from 'exifr';
import { AdvancedMarker, AdvancedMarkerProps, APIProvider, InfoWindow, Map, Pin, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import './App.css'
import { LineItemIdentifier } from '@mui/x-charts';


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

  const handleGalleryClick = useCallback((dir:number) => {
    let nextIndex = activeInd + dir;
    let maxInd = imageUrls.length - 1;
    if(nextIndex === maxInd) nextIndex = 0;
    if(nextIndex < 0) nextIndex = maxInd;
    handleMarkerClick(nextIndex);
  },[activeInd, imageUrls]);

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
          coords.push({ind: i, label: picName, image:imageUrl, location:pos, alt: data.GPSAltitude || null, cd: data.CreateDate});
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
          <div className="slideBtns">
            <IconButton aria-label="back" color="primary" onClick={()=>handleGalleryClick(-1)}>
              <NavigateBeforeIcon fontSize='large' htmlColor='#ffff' />
            </IconButton>
            <IconButton aria-label="next" onClick={()=>handleGalleryClick(1)}>
              <NavigateNextIcon fontSize='large' htmlColor='#ffff' />
            </IconButton>
          </div>
          <div className="photo">
            <img id="photo" src={`/images/${activeImage}`} alt='image' />
          </div>
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
              <ElevationChart data={mapData} tickClick={handleMarkerClick} activeIndex={activeInd} />              
            </div>
          </>
        )}
      </div>
    </>
  )
}

const ElevationChart = (props:{data: GPSInfo[], tickClick: (ind:number)=> void, activeIndex: number}) => {
 
  const handleTickClick = useCallback((data:LineItemIdentifier) => {
    if(data.dataIndex) props.tickClick(data.dataIndex);
  },[]);

  return (
    <LineChart
      xAxis={[{ scaleType: 'point', data:props.data.map((item) => item.image)}]}
      series={[
        {
          label: 'Altitude',
          connectNulls: true,
          data: props.data.map((item) => item.alt),
          area: true,
        },
      ]}
      onMarkClick={(event, d) => handleTickClick(d)}
    />
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
