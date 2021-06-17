const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://www.ebay.com/sch/i.html?_nkw=';

const SEEN_URLS = {};

const itemSelector = '#srp-river-results > ul > li';

const isSponsered = (str) => {
    let i = 0;
    const sponsoredWord = 'sponsored'.split('');
    const splitStr = str.toLowerCase().split('');
    splitStr.forEach(char => {
        if (char === sponsoredWord[i]) {
            i++;
        }
    });
    return i >= sponsoredWord.length;
}

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
    const itemsHtml = $('.srp-results').html();
    const $items = cheerio.load(itemsHtml);
    const items = $items('li.s-item').map((i, el) => {
        const item = $items(el);
        const title = item.find('.s-item__title').text();
        const price = item.find('.s-item__price').text();
        let sponsored = false;
        let changebleClass = '';
        item.find('span.s-item__sep')
            .children()
            .children()
            .each((i, el) => {
                if (i === 0) return changebleClass=el.attribs.class;
                if (el.attribs.class !== changebleClass) sponsored = true;
            });
        console.log(sponsored, price, title);
    });
    // $(itemSelector).each((i, el) => {
    //     const $item = cheerio.load($(el).html());
    //     const span = $item('span.s-item__sep')
    //         .children()
    //         .each((index, element) => console.log($(element).css()));
    // })
}

main('running+shoes')