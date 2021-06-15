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
    const itemsHtml = $('ul').get();
    const $items = cheerio.load(itemsHtml);
    // const items = $items('li').map((i, item) => {
    //     const itemHtml = $(item).html();
    //     const $item = cheerio.load(itemHtml);
    //     const desc = $item('.s-item__title').text();
    // });
    const items = $items('li').toArray().map((item, i) => {
        if (i<5) console.log(item);
    });
    //console.log(items);
}

main('running+shoes')