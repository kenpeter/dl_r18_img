const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const Promise = require('bluebird');

const mkdirp = require('mkdirp');
const util = require('util');

//const theList = 'http://www.r18.com/videos/vod/movies/list/id=45425/pagesize=30/price=all/sort=popular/type=studio/page=';
const theList = 'http://www.r18.com/videos/vod/movies/list/id=2001/pagesize=30/price=all/sort=popular/type=category/page=';
const theListLength = 1654;
//const theListLength = 1;


function genEachPage(theList, theListLength) {
  const theReturn = [];
  // theList ==== http://www.r18.com/videos/vod/movies/list/id=45425/pagesize=30/price=all/sort=popular/type=studio/page=/
  for(var i=1; i<=theListLength; i++) {
    let page = theList + i;
    theReturn.push(page);
  }

  return theReturn;
}

function main() {
  let pornArr = genEachPage(theList, theListLength);

  console.log("total page");
  console.log(pornArr);

  return Promise.each(pornArr, (page) => {
    return new Promise((resolve, reject) => {

      axios.get(page)
        .then((pageList) => {
          console.log("------ working on this list page --------");
          console.log(page);

          $ = cheerio.load(pageList.data, {xmlMode: false});
          let html = $('ul.cmn-list-product01 li a').get();
          let individualActorArr = [];

          for(var i=0; i<html.length; i++) {
            let myhref = html[i].attribs.href;
            if(myhref !== undefined) {
              individualActorArr.push(myhref);
            }
            else {

            }
          }

          resolve(individualActorArr);
        })
        .catch( (error) => {
          console.log(error);
        });

    })
    .then((individualActorArr) => {

      return Promise.each(individualActorArr, (actorPage) => {
        return new Promise((resolve, reject) => {

          axios.get(actorPage)
            .then((actorPageSource) => {
              //console.log(actorPageSource);
              $ = cheerio.load(actorPageSource.data, {xmlMode: false});
              let html = $('ul.js-owl-carousel li img.lazyOwl').get();
              //console.log(html);
              let imgSrcArr = [];
              for(var i=0; i<html.length; i++) {
                let imgSrc = html[i].attribs['data-src'];
                //console.log(imgSrc);

                let tmpArr = imgSrc.replace("http://pics.r18.com/", "").split("/");
                if(tmpArr[3].includes('jp-')){
                  imgSrcArr.push(imgSrc);
                }
                else {
                  continue;
                }
              }

              //console.log(imgSrcArr);
              resolve(imgSrcArr);
            })
            .catch( (error) => {
              console.log(error);
            });
        })
        .then((imgSrcArr) => {
          //console.log('--------------');
          //console.log(imgSrcArr);
          return Promise.each(imgSrcArr, (imgUrl) => {
            return new Promise((resolve, reject) => {
              axios.get(imgUrl, {responseType: 'arraybuffer'})
                .then((imgData) => {
                  // http://pics.r18.com/digital/video/h_237suda00021/h_237suda00021jp-1.jpg
                  let narr = imgUrl.replace("http://pics.r18.com/", "").split("/");
                  let savePath = __dirname + "/upload/tmp/" + narr[3];
                  // https://github.com/mzabriskie/axios/issues/448
                  fs.writeFile(savePath, imgData.data, "binary", (err) => {
                    if(err) {
                      console.log(err);
                    }
                    else {
                      console.log(`save: ${imgUrl}`);
                      resolve();
                    }
                  });

                });

            });

          });

        });
      });
    });
  });
}

main().then(() => {
  console.log('done');
  process.exit(0);
});
