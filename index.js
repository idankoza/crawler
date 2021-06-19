const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const BASE_URL = (searchTerm) => `https://www.ebay.com/sch/i.html?_nkw=${searchTerm}`;

const RELATED_SELECTOR = '.srp-related-searches';
const ITEM_SELECTOR = 'li.s-item';
const SPONSORED_SELECTOR = 'span.s-item__sep';
const TITLE_SELECTOR = '.s-item__title';
const PRICE_SELECTOR = '.s-item__price';
const SHIPPING_SELECTOR = '.s-item__shipping';
const LOCATION_SELECTOR = '.s-item__location';
const IMAGE_SELECTOR = '.s-item__image-img';
const NEXT_PAGE_SELECTOR = '.pagination__next';
const PAGING_ITEMS_SELECTOR = '.pagination__items'

const getRenderedHtml = async (url) => {
    const browser = await puppeteer.launch({
        headless: false,
    });
    const [page] = await browser.pages();
    await page.goto(url);
    const pages = [];
    const seenUrl = {};
    let currentUrl = page.url();
    while (!seenUrl[currentUrl]) {
        try {
            seenUrl[currentUrl] = true;
            const currentPage = await page.evaluate(() => document.querySelector('*').outerHTML);
            pages.push(currentPage);
            await page.click(NEXT_PAGE_SELECTOR);
            await page.waitForSelector(PAGING_ITEMS_SELECTOR);
            currentUrl = page.url();
        }
        catch {
            return { success: true, data: pages };
        }
    }
    await browser.close();
    return { success: true, data: pages };
}


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
        const Title = item.find(TITLE_SELECTOR).text();
        const Price = item.find(PRICE_SELECTOR).text();
        if (!Title || !Price) return;
        const Shipping = item.find(SHIPPING_SELECTOR).text();
        const ShipsFrom = item.find(LOCATION_SELECTOR).text();
        const img = item.find(IMAGE_SELECTOR).get();
        const Image = img[0]?.attribs?.src
        const Sponsored = isSponsered(item);
        return ({
            Title,
            Price,
            Sponsored,
            Shipping,
            ShipsFrom,
            Image
        });
    });
}
const handlePage = (page, i) => {
    const $ = cheerio.load(page);
    const relatedItems = i === 0 && getRelatedItems($);
    const items = getItemsFromPage($);
    const fixItems = items.filter(item => item);
    return { fixItems, relatedItems };
}

const main = async (searchTerm) => {
    const url = searchTerm.includes('http') ? searchTerm : BASE_URL(searchTerm);
    const response = await getRenderedHtml(url)
        .catch((err) => console.log(err));
    if (!response?.success) return console.log(response.err);
    const results = response.data.map((page, i) => handlePage(page, i));
    const allItems = results.reduce((all, curPageResult) => [...all, ...curPageResult.fixItems], []);
    const fixAllItems = allItems.map((item, i) => ({
        ...item,
        position: i + 1
    }));
    const relatedItems = results[0].relatedItems;
    return { relatedItems, fixAllItems };
}

main('haircut+machine').then(res => {
    const { relatedItems, fixAllItems } = res;
    console.log(relatedItems);
    console.table(fixAllItems);
})





