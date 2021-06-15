const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.ebay.com/sch/i.html?_nkw=';

const SEEN_URLS = {};

const main = async (searchTerm) => {
    const url = searchTerm.includes('http') ? searchTerm : BASE_URL + searchTerm;
    if (SEEN_URLS[url] || Object.keys(SEEN_URLS).length > 20) return;
    SEEN_URLS[url] = true;
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    const relatedHtml = $('.srp-related-searches').html();
    const $related = cheerio.load(relatedHtml)
    const links = $related('a').toArray().map((x) => $(x).text());
    console.log(links);
    // const imageUrls = $('img')
    //     .map((i, link) => link.attribs.src)
    //     .get()
    // imageUrls.forEach((imageUrl, i) => {
    //     fetch(imageUrl).then(response => {
    //         const filename = path.basename(imageUrl)
    //         const dest = fs.createWriteStream(`images/${i+filename}`)
    //         response.body.pipe(dest)
    //         console.log('finish', filename, i)
    //     });
    // });
    // return links.forEach(link => main(link));
}

main('running+shoes')