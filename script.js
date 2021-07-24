let fs = require("fs");
let request = require("request");
let cheerio = require("cheerio");
const { default: jsPDF } = require("jspdf");
let $;
let data = {};
request("https://github.com/topics",topicspagereacher)

function topicspagereacher(err,resp,body){
    if(!err){
        $ = cheerio.load(body);
        let pagelink = $(".no-underline.d-flex.flex-column.flex-justify-center");
        let pagename =  $(".f3.lh-condensed.text-center.Link--primary.mb-0.mt-1");
       for(let i  = 0; i<pagelink.length; i++){
           fs.mkdirSync(`${$(pagename[i]).text().trim()}`);
           getProjects("https://github.com/"+$(pagelink[i]).attr("href"),$(pagename[i]).text().trim());
       }
    }
}

function getProjects(topiclink,topicName){
    request(topiclink,function(err,resp,body){
        if(!err){
            $ = cheerio.load(body);
            let projects = $(".f3.color-text-secondary.text-normal.lh-condensed .text-bold");
            if(projects.length>8){
                projects = projects.slice(0,8);
            }
            for(let i = 0; i<projects.length; i++){
                let projectLink  = "https://github.com"+ $(projects[i]).attr("href");
                let projectName = $(projects[i]).text().trim();
                if(!data[topicName]){
                    data[topicName] = [{projectName,projectLink}];
                }else{
                    data[topicName].push({projectName,projectLink});
                }
                getIssues(projectName,projectLink,topicName);
            }
        }
    })
}

    function getIssues(projectName,projectLink,topicName){
        request(projectLink+"/issues",function(err,resp,body){
            if(!err){
                $ = cheerio.load(body);
                issues = $(".Link--primary.v-align-middle.no-underline.h4.js-navigation-open.markdown-title");
                let idx = data[topicName].findIndex(function(e){
                    return e.projectName == projectName;
                })
                for(let i = 0; i<issues.length; i++){
                    issueName =  $(issues[i]).text().trim();
                    issueLink = "https://github.com" + $(issues[i]).attr("href");
                    if(!data[topicName][idx].issues){
                        data[topicName][idx].issues = [{issueName,issueLink}];
                    }else{
                        data[topicName][idx].issues.push({issueName,issueLink});
                    }
                }
                pdfGenerator();
            }
        })
    } 

    function pdfGenerator(){
        for(let x in data){
            let tArr = data[x];
            for(let y in tArr){
                let pn = data[x][y].projectName;
                if(fs.existsSync(`${x}/${pn}.pdf`)){
                    fs.unlinkSync(`${x}/${pn}.pdf`);
                }
                const doc = new jsPDF();
                let iArr = data[x][y].issues;
                for(let z in iArr){
                    doc.text(iArr[z].issueName,10,15*z+10);
                    doc.text(iArr[z].issueLink,10,15*z+15);
                }
                doc.save(`${x}/${pn}.pdf`);
            }
        }
    }