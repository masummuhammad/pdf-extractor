// import required modules
const fs=require('fs');
const path=require('path');
//the crossplatform pdf parser module
const pdfParser=require('pdf-parse');


const extractor=(file)=>
{
return new Promise((resolve,reject)=>{
//pdfs folder
 
        
        const dataBuffer=fs.readFileSync((file),(err)=>{
            if(err)throw(err);
        });
        //making databuffer with pdfParser
        //a promise
        
        pdfParser(dataBuffer).then((data)=>{//resolving pdfParser[promise]
            /*gettin' text from pdf as lowercase and
            splitin the text with newline('\n')
            */
            const textData=data.text.toLowerCase().split('\n');
            //an array to store specific data value of previously created array splitin '\n'
            const tempArr=[];
            let pdfType =path.basename(file).replace('.pdf','').match(/[A-Za-z]/gi);
            var tempObj={filename:path.basename(file),type:pdfType.join('')};
            textData.forEach(e=>{
                if(/nr\.[0-9]+\/[0-9]+/.test(e)){
                    tempArr.push(e.split(/     +/g));
                }
                if(/\:/.test(e)){
                    //splitin every array element with ':'
                    let tarr=e.replace(/      +/g,':').split(':');
                    let tarr2=[];
                    
                    tarr.forEach(elem=>{
                        //removing '' element of array
                        if(elem !== ''){
                            tarr2.push(elem);
                        }
                    });
                    tempArr.push(tarr2);
                }
            });
            
            var arrayObj=[];
            var transactionDetails=[];
            var obj={};
            tempArr.forEach(e=>{
                //first three conditions for replacing ',' with '.'
                if(/\*/.test(e[0])){
                    e[0]=e[0].replace(/\*/g,'');
                }
                if(e.length==4 && typeof(parseInt(e[1]))=='number' && typeof(parseInt(e[3]))=='number'){
                    e[1]=e[1].replace(',','.');
                    e[3]=e[3].replace(',','.');
                };
                if(e.length==2 && typeof(parseInt(e[1]))=='number' && e[0]!=='depotinhaber'){
                    e[1]=e[1].replace(',','.');
                }
                if(/nr\.[0-9]+\/[0-9]+/.test(e[0])){
                    let fd=e[2].split('(');
                    
                    
                    transactionDetails.push({transactionnumber:e[0],transactiontype:e[1],underlying:fd[0].toUpperCase().trim(),isinwkn:fd[1].replace(')','')});
                    
                }
                
                if(/ausgeführt/.test(e[0].trim())){
                    if(obj.hasOwnProperty('ausgefurt')){
                        arrayObj.push(obj);
                        obj={};
                        obj['ausgefurt']=e[1].replace(/kurswert/g,'').trim().replace(',','.');
                        obj['kurswert']=e[2].trim().replace(',','.');
                    }
                    else{
                        obj['ausgefurt']=e[1].replace(/kurswert/g,'').trim().replace(',','.');
                        obj['kurswert']=e[2].trim().replace(',','.');
                    }
                    
                }
                else if(e[0].trim()==='kurs'){
                    obj['kurs']=e[1].replace(/provision/g,'').trim().replace(',','.');
                    obj['provision']=e[2].trim().replace(',','.');
                }
                
                else if(/gewinn\/verlust/.test(e[0])){
                    obj['gewinn']=e[1].replace('**einbeh. steuer','').trim().replace(',','.');
                    obj['steuer']=e[2].replace(',','.');
                }
                if(/ihre depotnummer/.test(e[0])){
                    tempObj['depot']=e[1].trim();
                }
                else if(/depotinhaber/.test(e[0])){
                    tempObj['depotinhaber']=e[1].trim();
                };
                //except tel and email every 2 length array will set it's 1st element to key and 2nd  value
                if(e.length==2 && (e[0].trim()!=="tel." && e[0].trim()!=='e-mail' && e[0].trim()!=='ust-idnr.' && e[0].trim()!=='ihre depotnummer' && e[0].trim()!=='depotinhaber') && !(/blz/.test(e[0])) && !(/ausführungszeit/.test(e[0])) && !(/die verrechnung/.test(e[0]))){
                        if(e[0].trim()=='tradinggebühr'){
                            obj['tradinggebuehr']=e[1].trim();
                        }
                        else if(e[0].trim()=='solidaritätszuschlag'){
                            obj['soli']=e[1].trim();
                        }
                        else{
                        obj[e[0].trim()]=e[1].trim();    
                        }
                    
                }
                else if(e.length==4){

                         obj[e[0].trim()]=e[1];
                         obj[e[2].trim()]=e[3];
                }
                
                
        
            })
            
            arrayObj.push(obj);
            let arrayObj2=[];
            
            for(let i=0;i<transactionDetails.length;i++){
                //adding the transactionDetails object to the objects of arrayObj
                let xobj=Object.assign({},arrayObj[i],transactionDetails[i]);
                arrayObj2.push(xobj);
                
            }
            tempObj['transactionData']=arrayObj2;
           resolve(JSON.stringify(tempObj));
        }).catch((err)=>{
            //rejection of promise
            reject(err);
            throw(err);
        })
    });
};



module.exports=extractor;