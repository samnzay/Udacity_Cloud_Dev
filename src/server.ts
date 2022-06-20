import express from 'express';
import Jimp = require("jimp");
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';

const multer = require('multer');
const upload = multer({dest: 'src/tmp/uploads'});

(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));

//URL Validation reference from www.stackoverflow.com
  function checkURLInputValidation(url_image : string) {
    let CheckPatterns = new RegExp('^(https?:\\/\\/)?'+'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+'((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+'(\\?[;&a-z\\d%_.~+=-]*)?'+'(\\#[-a-z\\d_]*)?$','i');
    return !!CheckPatterns.test(url_image);
  }

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */

  //! END @TODO1


 //FILTER IMAGE FROM PUBLIC URL
 //=============STARTS=========
  app.get("/filteredimage", async(req, res)=>{

    const inputURL= req.query.image_url;

    const validImageUrl = checkURLInputValidation(inputURL);//Validate url input first

    if(validImageUrl){
      const outpath = await ( filterImageFromURL(inputURL));

      res.status(200).sendFile(outpath,//Send Image after processing
        ()=> deleteLocalFiles([outpath]));//Delete image from disk
    }
    else{
      return res.status(400).send("Invalid URL: " + inputURL );//return error when url is invalid
    }

  });


  //FILTER IMAGE FROM DIRECT UPLOAD
  //==============STARTS===========
  app.post("/filteredimage/upload", upload.single('file'), async(req, res)=>{

    //File Image validations /Reference from www.stackoverflow.com, 
    const imageFile= req.file;
    const maxfilesize = 8;//limit to 8MB file size
    const allowedfiles= ['jpeg','jpg', 'png', 'gif'];
    const imagetypesAllowed = ['image/jpg', 'image/gif', 'image/png', 'image/jpeg'];

    const imageFileExtension = imageFile.originalname.slice(
      ((imageFile.originalname.lastIndexOf('.')-1 ) >>> 0) + 2
    );
    if(!allowedfiles.includes(imageFileExtension) || !imagetypesAllowed.includes(imageFile.mimetype)){

      throw Error('Uploaded file is not Valid. Use allowed Image format');

    }
    if((imageFile.size/ (1024 * 1024)> maxfilesize)){

      throw Error('File Size is too large, Upload only files below 4M');
    }

    //FILTER THE UPLOADED IMAGE
    const imageUpload = imageFile;
    try {
      const photo = await Jimp.read(imageUpload.path);
      const outpath = "/tmp/filtered." + Math.floor(Math.random() * 2000) + ".jpg";
      const uploadpath =  imageUpload.path;
      const addfont = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);  //Add Font
      await photo
        .resize(256, 256) // resize
        .quality(60) // set JPEG quality
        .greyscale() // set greyscale
        .print(addfont, 0,0, "Samuel N. Image Upload")//add some Text
        .write(__dirname + outpath, (img)=>{
          return res.status(200).download(__dirname + outpath, //download processed Image
            ()=> deleteLocalFiles([__dirname + outpath, uploadpath])//Delete Processed Image, and Original Upload Path
            
            );
        });

        //return res.send('Processing Success')
    } catch (error) {

      return res.status(500).send("Sorry Something Went wrong with Image Processing");
    
    }
  })
  //FILTER IMAGE FROM DIRECT UPLOAD
  //============ENDS===============
  
      // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );

  
  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();