const cheerio = require('cheerio');
const axios = require('axios');
const prompt = require('prompt');
const {
    getItemsFromPage,
    getRelatedSearch,
    isValidSearchTerm,
    fixSearchTerm
} = require('./handler');

const BASE_URL = searchTerm => `https://www.ebay.com/sch/i.html?_nkw=${searchTerm}`;

const crwal = async (searchTerm) => {
    const url = searchTerm.includes('http') ? searchTerm : BASE_URL(searchTerm);
    const response = await axios.get(url)
        .catch((err) => console.log(err));
    if (!response) return console.log('Failed');
    const $ = cheerio.load(response.data);
    const relatedSearchTerms = getRelatedSearch($)
    const items = getItemsFromPage($);
    const fixItems = items.filter(item => item);
    return {
        Related: relatedSearchTerms,
        Items: fixItems
    };
}

prompt.start();
prompt.get(['Search Term'], (err, result) => {
    if (err) return console.log(err);
    const input = result['Search Term'];
    if (!input) return console.log('Empty search term');
    const searchTerm = fixSearchTerm(input);
    if (!isValidSearchTerm(searchTerm)) return console.log('Invalid Input');
    crwal(searchTerm).then(res => {
        if (!res) return console.log('Failed to get data');
        const { Related, Items } = res;
        console.log(Related, Items.slice(0,4));
    });
})







