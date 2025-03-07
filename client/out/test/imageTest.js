const express = require('express')
const app = express()
const port = 3000

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
const suggestAltText = require("../../../server/out/helpers/img-caption");
const bodyParser = require('body-parser');

app.use(express.json())
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, 'images'))) // images to test are saved in the images folder

app.post('/generate', async (req, res) => {
	console.log(req.body)
    const {link,file} = req.body
	let caption, original
	if (link != "") {
    	caption = await suggestAltText(link)
		original = link
	} else {
		caption = await suggestAltText(`${__dirname}/images/${file}`) 
		original = file
	}
	console.log(caption)
	console.log(original)
    const response = await fetch(
        "https://router.huggingface.co/hf-inference/models/CompVis/stable-diffusion-v1-4",
        { 
            headers: {
                Authorization: process.env.BLIP_TOKEN,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify(caption)
        }
    )
    const result = await response.blob()
    let ab = await result.arrayBuffer();
	const binary = Buffer.from(new Uint8Array(ab), "base64").toString("base64")
    
	res.writeHead(200, {
		'content-type': 'text/html'
	});
	if (original != "") res.write(`<img src=${original}>`)
	res.write(`<img src="data:image/jpeg;base64,${binary}">`)
	
	res.end()
})

app.get('/', async (req, res) => {
    res.sendFile(__dirname + "/imageComparisonTest.html")
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})