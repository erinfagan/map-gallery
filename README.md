# Map Gallery

Silly project to visualize location and altitude progress from my Tour Du Mont Blanc trip.

[View Live Here](www.aodha.com)


High Level Requirements:

- parse lat,long and altitude from the photo EXIF data
- display locations on Google Map
- humble-brag about the elevation changes in a line chart

UI/UX:

- maximize space for photo display, then map, then chart
- click map markers to load photo for that location and keep that marker 'active'
- display clear relationship between photo, map marker and point on chart
- responsive layout that works on web and mobile devices


## Libraries Used

These were selected because they were the most up-to-date and had good documentation.

- [Chart.js](https://github.com/chartjs/Chart.js) for the line graph
  - modular
- [Exifr](https://github.com/MikeKovarik/exifr) to parse JPEG EXIF data
  - modular
  - can specify parsing of minimal data (only need 4 properties extracted)
  - in-browser file loading (other options only worked with Node)
- [react-google-map](https://github.com/JustFly1984/react-google-maps-api)
  - Google-recommended for using Maps in React


## Possible Improvements

- I'm using an `<img>` tag for the gallery area AND having exifr library load the exif data from the same file
  - ideally, the .JPEG would be loaded once and that data would be rendered to the page and the exif pulled from there
  - this should be possible with the exifr library and I should continue to tinker with it
- The image file names are stored in a `const`
  - just pulling all files from the `public/images/` folder would more flexible and allow gallery functionality
- Add gallery navigation arrows to click through images and trigger the `<InfoWindow>` in the map
- Make the `<InfoWindow>` prettier, that's an ugly gap at the top
- Indicate the active image inside the chart and make the data points clickable to change the active image

## Overkill Improvement

- Set up an S3 bucket with a Lambda function that is triggered by object creation
- function parses out the relevant exif properties and stores it as custom object metadata for the image
- app now requests images from S3 bucket and uses the metadata instead of parsing the exif
