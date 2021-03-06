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
            
            var tempObj={filename:path.basename(file)};
            textData.forEach((e,i)=>{
                
                if(/ihre depotnummer/.test(e)){
                    tempObj.type=textData[i-1].trim();
                }
                if(/nr\.[0-9]+\/[0-9]+/.test(e)){
                    tempArr.push(e.split(/     +/));
                }
                if(/\:/.test(e) && !(/nr\.[0-9]+\/[0-9]+/.test(e))){
                    //splitin every array element with ':'
                    let tarr=e.replace(/  +/g,':').split(':');
                    
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
            var obj={};
            var transactionDetails=[];
            
            tempArr.forEach(e=>{
                
                //first three conditions for replacing ',' with '.'
                if(e.length==4 && typeof(parseInt(e[1]))=='number' && typeof(parseInt(e[3]))=='number' && e[0].trim()!=='valuta'){
                    e[1]=e[1].replace(',','#').replace('.','').replace('#','.');
                    e[3]=e[3].replace(',','#').replace('.','').replace('#','.');
                };
                if(e.length==2 && typeof(parseInt(e[1]))=='number' && !(/nr\.[0-9]+\/[0-9]+/.test(e[0]))){
                    e[1]=e[1].replace(',','#').replace('.','').replace('#','.');
                }
                if(e.length==5 && typeof parseInt(e[1])=='number'){
                    e[1]=e[1].replace(',','#').replace('.','').replace('#','.');
                }
                if(/ihre depotnummer/.test(e[0])){
                    tempObj['depot']=e[1].trim();
                }
                else if(/depotinhaber/.test(e[0])){
                    tempObj['depotinhaber']=e[1].trim();
                }
                else if(/nr\.[0-9]+\/[0-9]+/.test(e[0])){
                    
                    if(e.length==3){
                        let fd=e[0].split(/ +/);
                        let temp=e[2].split('(');
                        let pt=e[1]+' '+temp[0];
                        let pf=[pt,temp[1]];
                        
                        transactionDetails.push({transactionnumber:fd[0],transactiontype:fd[1],underlying:pf[0].toUpperCase().trim(),isinwkn:pf[1].replace(')','')});
                    }
                    else{
                    
                    let fd=e[0].split(/ \s+/);
                    let pf=e[1].split('(');
                    if(/  +/.test(pf[0])){
                        pf[0]=pf[0].replace(/  +/,' ');
                    }
                    
                    transactionDetails.push({transactionnumber:fd[0],transactiontype:fd[1],underlying:pf[0].toUpperCase().trim(),isinwkn:pf[1].replace(')','')});
                    }
                    
                    
                }
               
                //except tel and email every 2 length array will set it's 1st element to key and 2nd  value
                if(e.length==2 && (e[0].trim()!=="tel." && e[0].trim()!=='e-mail' && e[0].trim()!=='ust-idnr.' && e[0].trim()!=='ihre depotnummer' && e[0].trim()!=='depotinhaber') && !(/blz/.test(e[0])) && !(/nr\.[0-9]+\/[0-9]+/.test(e[0])) && !(/die verrechnung/.test(e[0]))){
                        if(e[0].trim()=='tradinggeb??hr'){
                            obj['tradinggebuehr']=e[1].trim();
                        }
                        else if(e[0].trim()=='solidarit??tszuschlag'){
                            obj['soli']=e[1].trim();
                        }
                        else{
                        obj[e[0].trim()]=e[1].trim();    
                        }
                    
                }
                else
                {             
                
                if(/ordervolumen/.test(e[0])){
                    if(obj.hasOwnProperty('ordervolumen')){
                        arrayObj.push(obj);
                        obj={};
                        obj['ordervolumen']=e[1].trim();
                        obj['handelsplatz']=e[3].trim();
                    }else{
                        obj['ordervolumen']=e[1].trim();
                        obj['handelsplatz']=e[3].trim();
                    }
                   
                }
                else if(/davon ausgef/.test(e[0])){
                   
                        obj['ausgefuehrt']=e[1].trim();
                        obj['schlusstag']=e[3].trim()+":"+e[4];    
                    
                    
                }
                
                else if("kurs"===e[0].trim()){
                    
                        obj['kurs']=e[1].trim();
                        obj['kurswert']=e[3].trim();    
                    
                    
                }
                else if(/devisenkurs/.test(e[0])){
                    if(e.length===3){
                        obj['devisenkurs']='';
                        
                        obj['provision']=e[2].trim().replace(',','.');
                             
                        
                        
                    }
                }
                else if(/bew-faktor/.test(e[0])){
                    if(e.length===3){
                        
                        
                        obj['bew-faktor']=e[1].trim().replace(',','.');
                             
                        
                        obj['eigenespesen']='';
                    }
                    else{
                        obj['bew-faktor']=e[1].trim().replace(',','.');
                        obj['eigenespesen']=e[3].trim();
                    }
                }
                else if(/verwahrart/.test(e[0])){
                    //still some fields has extra '*fremde spesen' that's why we manually removed it
                    if(/\*fremde spesen/.test(e[1])){
                        e[1]=e[1].replace(/\*fremde spesen/g,'');
                    };
                    if(e.length===3){
                           obj['verwahrart']=e[1].trim();
                            obj['fremdespesen']='';
                        
                        
                        
                    }
                    else{
                        
                            obj['verwahrart']=e[1].trim();
                            obj['fremdespesen']=e[3].trim();
                        
                    }
                }
                else if(/lagerland/.test(e[0])){
                    if(e.length===3){
                        obj['lagerland']=e[1].trim();
                        obj['bemessung']='';
                    }
                }
                else if(/gewinn\/verlust/.test(e[0])){
                    obj['gewinn']=e[1].trim();
                    obj[e[2].trim()]=e[3].trim();
                }
                else if(/valuta/.test(e[0])){
                    obj[e[0].trim()]=e[1].trim();
                    obj['steuer']=e[3].trim().replace(',','.');
                }
            };
            })
            
            arrayObj.push(obj);
            let arrayObj2=[];
            for(let i=0;i<transactionDetails.length;i++){
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