const extractor=require('./extractor');
extractor(process.argv[2]).then(e=>{console.log(e);}).catch((err)=>{throw err});
 
