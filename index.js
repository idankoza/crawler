const cheerio = require('cheerio');
const axios = require('axios');

const BASE_URL = (searchTerm, page) => `https://www.ebay.com/sch/i.html?_nkw=${searchTerm}&_pgn=${page}&rt=nc`;

const RELATED_SELECTOR = '.srp-related-searches';
const ITEM_SELECTOR = 'li.s-item';
const SPONSORED_SELECTOR = 'span.s-item__sep';
const TITLE_SELECTOR = '.s-item__title';
const PRICE_SELECTOR = '.s-item__price';
const SHIPPING_SELECTOR = '.s-item__shipping';
const LOCATION_SELECTOR = '.s-item__location';
const IMAGE_SELECTOR = '.s-item__image-img';


const isSponsered = (item) => {
    let sponsored = false;
    let changebleClass = '';
    item.find(SPONSORED_SELECTOR)
        .children()
        .children()
        .each((i, el) => {
            if (i === 0) return changebleClass = el.attribs.class;
            if (el.attribs.class !== changebleClass) sponsored = true;
        });
    return sponsored;
}
const getRelatedItems = ($) => {
    const relatedHtml = $(RELATED_SELECTOR).html();
    if (typeof relatedHtml !== 'string') return [];
    const $related = cheerio.load(relatedHtml)
    return $related('a').toArray().map((x) => $(x).text());
}
const getItemsFromPage = ($) => {
    return $(ITEM_SELECTOR).toArray().map((el, i) => {
        const item = $(el);
        const Position = i;
        const Title = item.find(TITLE_SELECTOR).text();
        const Price = item.find(PRICE_SELECTOR).text();
        if (!Title || !Price) return;
        const Shipping = item.find(SHIPPING_SELECTOR).text();
        const ShipsFrom = item.find(LOCATION_SELECTOR).text();
        const img = item.find(IMAGE_SELECTOR).get();
        const Image = img[0]?.attribs?.src
        const Sponsored = isSponsered(item);
        return ({
            Position,
            Title,
            Price,
            Sponsored,
            Shipping,
            ShipsFrom,
            Image
        });
    });
}

const main = async (searchTerm, page) => {
    const url = searchTerm.includes('http') ? searchTerm : BASE_URL(searchTerm, page);
    const response = await axios.get(url);
    if (!response || !response.data) return;
    const $ = cheerio.load(response.data);
    const relatedItems = getRelatedItems($)
    const items = getItemsFromPage($);
    const fixItems = items.filter(item => item);
    return {relatedItems, fixItems};
}

const first = BASE_URL('running+shoes', 4);
const second = BASE_URL('running+shoes', 5);

axios.get(first).then(res => console.log(res.data));


