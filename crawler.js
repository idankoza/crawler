const cheerio = require('cheerio');
const axios = require('axios');
const prompt = require('prompt');

const BASE_URL = searchTerm => `https://www.ebay.com/sch/i.html?_nkw=${searchTerm}`;
const ITEM_BASE_URL = 'https://www.ebay.com/itm/';

const RELATED_SELECTOR = '.srp-related-searches';
const ITEM_SELECTOR = 'li.s-item';
const SPONSORED_SELECTOR = 'span.s-item__sep';
const TITLE_SELECTOR = '.s-item__title';
const PRICE_SELECTOR = '.s-item__price';
const SHIPPING_SELECTOR = '.s-item__shipping';
const LOCATION_SELECTOR = '.s-item__location';
const IMAGE_SELECTOR = '.s-item__image-img';

const isSponsered = item => {
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

const getIdFromLink = (link) => {
    const linkRemovedBase = link.replace(ITEM_BASE_URL, '');
    const [ID] = linkRemovedBase.split('?');
    return ID;
};

const getImageSrc = item => {
    const img = item.find(IMAGE_SELECTOR).get();
    return img[0]?.attribs?.src;
};

const getTextDetails = (selectors, item) => selectors.map(selector => item.find(selector).text());

const getItemsFromPage = $ => {
    return $(ITEM_SELECTOR).toArray().map((el, i) => {
        const item = $(el);
        const itemHref = item.find('a')
            .map((i, el) => el.attribs.href)
            .get();
        const ID = getIdFromLink(itemHref[0]);
        const Position = i;
        const detailsSelectors = [TITLE_SELECTOR, PRICE_SELECTOR, SHIPPING_SELECTOR, LOCATION_SELECTOR];
        const [Title, Price, Shipping, ShipsFrom] = getTextDetails(detailsSelectors, item);
        if (!Title || !Price || !itemHref[0]) return;
        const Image = getImageSrc(item);
        const Sponsored = isSponsered(item);
        return ({
            ID,
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

const main = async (searchTerm) => {
    const url = searchTerm.includes('http') ? searchTerm : BASE_URL(searchTerm);
    const response = await axios.get(url)
        .catch((err) => console.log(err));
    if (!response) return console.log('Failed');
    const $ = cheerio.load(response.data);
    const relatedItems = getRelatedItems($)
    const items = getItemsFromPage($);
    const fixItems = items.filter(item => item);
    return { relatedItems, fixItems };
}

prompt.start();
prompt.get(['Search Term'], (err, result) => {
    if (err) return console.log(err);
    const searchTerm = result['Search Term'].replace(/ /g, '+');
    main(searchTerm).then(res => console.log(res));
})







