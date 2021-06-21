const extractor=require('./extractor');
const fs=require('fs');
const path=require('path');
fs.readdir('pdfs',(err,files)=>{
    if(err)throw err;
    files.forEach(file=>{
        extractor(path.join('pdfs',file)).then(e=>{console.log(e);}).catch((err)=>{throw err});
    })
})
