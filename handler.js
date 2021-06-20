const cheerio = require('cheerio');

const handler = {};

const ITEM_BASE_URL = 'https://www.ebay.com/itm/';

const RELATED_SELECTOR = '.srp-related-searches';
const ITEM_SELECTOR = 'li.s-item';
const SPONSORED_SELECTOR = 'span.s-item__sep';
const TITLE_SELECTOR = '.s-item__title';
const PRICE_SELECTOR = '.s-item__price';
const SHIPPING_SELECTOR = '.s-item__shipping';
const LOCATION_SELECTOR = '.s-item__location';
const IMAGE_SELECTOR = '.s-item__image-img';

handler.isValidSearchTerm = str => {
    const regex = /^[~`!@#$%^&*()_+=[\]\{}|;':",.\/<>?a-zA-Z0-9-]+$/;
    return regex.test(str)
};

handler.fixSearchTerm = str => {
    return str
        .replace(/%/g, '%25')
        .replace(/\+/g, '%2b')
        .replace(/\?/g, '%3F')
        .replace(/,/g, '%2C')
        .replace(/&/g, '%26')
        .replace(/=/g, '%3D')
        .replace(/\\/g, '%5C')
        .replace(/\//g, '%2F')
        .replace(/\|/g, '%7C')
        .replace(/ /g, '+')
};

const isSponsered = item => {
    let sponsored = false;
    let changebleClass;
    item.find(SPONSORED_SELECTOR)
        ?.children()
        ?.children()
        ?.each((i, el) => {
            if (i === 0) return changebleClass = el.attribs.class;
            if (el.attribs.class !== changebleClass) sponsored = true;
        });
    return sponsored;
}

const getItemId = (item) => {
    const itemHref = item.find('a')
        .map((i, el) => el.attribs.href)
        .get();
    if (!itemHref[0]) return null;
    const linkRemovedBase = itemHref[0].replace(ITEM_BASE_URL, '');
    const [ID] = linkRemovedBase.split('?');
    return ID;
};

const getImageSrc = item => {
    const img = item.find(IMAGE_SELECTOR).get();
    return img[0]?.attribs?.src;
};

const getTextDetails = (selectors, item) => selectors.map(selector => item.find(selector).text());

handler.getItemsFromPage = $ => {
    return $(ITEM_SELECTOR).toArray().map((el, i) => {
        const item = $(el);
        const detailsSelectors = [TITLE_SELECTOR, PRICE_SELECTOR, SHIPPING_SELECTOR, LOCATION_SELECTOR];
        const [Title, Price, Shipping, ShipsFrom] = getTextDetails(detailsSelectors, item);
        if (!Title || !Price) return;
        return {
            ID: getItemId(item),
            Position: i,
            Title,
            Price,
            Sponsored: isSponsered(item),
            Shipping,
            ShipsFrom,
            Image: getImageSrc(item)
        };
    });
}

handler.getRelatedSearch = ($) => {
    const relatedHtml = $(RELATED_SELECTOR).html();
    if (typeof relatedHtml !== 'string') return null;
    const $related = cheerio.load(relatedHtml)
    return $related('a').toArray().map((x) => $(x).text());
}

module.exports = handler;