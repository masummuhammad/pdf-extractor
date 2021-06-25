const extractor=require('./extractor-2');
extractor(process.argv[2]).then(e=>{console.log(e);}).catch((err)=>{throw err});
 