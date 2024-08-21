import { parse } from 'node-html-parser';
import { removeUrlParams } from './utils/url';
import assert from 'assert';
import { Taaft } from '@/db/schema';
import { subDays, subHours } from 'date-fns';

type PuppeteerResp = {
  error: boolean,
  source: string | null
}

function convertToDate(dateString: string): Date {
  const now = new Date();
  
  if (dateString.includes('Added')) {
    const [, amount, unit] = dateString.split(' ');
    if (unit === 'ago') {
      if (amount.endsWith('h')) {
        const hours = parseInt(amount);
        return subHours(now, hours);
      } else if (amount.endsWith('d')) {
        const days = parseInt(amount);
        return subDays(now, days);
      }
    }
  }
  return new Date(dateString);
}

function removeTAAFTQueryParams(url?: string | null) {
  if(!url) throw new Error('not a valid url');
  return removeUrlParams(url, ['ref', 'term', 'utm_medium', 'utm_source', 'utm_source']);
}

export async function fetchTAAFTLatest() {
  const resp = await fetch(`${process.env.PUPPETEER}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url: 'https://theresanaiforthat.com/just-launched/' })
  });
  const json = await resp.json() as PuppeteerResp;
  if(!json.error && json.source){
    const root = parse(json.source);
    const ais = root.querySelectorAll("div.li_row");
    const results = ais.flatMap((item) => {
      const icon = item.querySelector('.li_left img');
      const taaft_link = item.querySelector('.ai_link');
      const product_name = taaft_link?.innerText;
      const product_link = item.querySelector('a.external_ai_link')?.attributes['href'];
      return {
        icon: icon?.attributes['src'],
        product_name: product_name,
        product_link: removeTAAFTQueryParams(product_link),
        taaft_link: removeTAAFTQueryParams('https://theresanaiforthat.com' + taaft_link?.attributes['href'])
      }
    })
    return results;
  }else{
    throw new Error('taaft puppeteer return error');
  }
}
type TaaftApiType = Omit<Taaft, "id" | "webp" | "created_at" | "uuid">;

export async function fetchTAAFTProductDetails(url: string): Promise<TaaftApiType> {
  const resp = await fetch(`${process.env.PUPPETEER}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
    next: { revalidate: 3000 }
  });
  const json = await resp.json() as PuppeteerResp;
  if(json.error || !json.source) throw new Error('taaft puppeteer return error');
  const root = parse(json.source);
  root.querySelector('div.description')?.querySelector('div.method')?.remove();
  const description = root.querySelector('div.description')?.innerText.trim();
  const product_name = root.querySelector('h1.title_inner')?.innerText;
  const product_tagline = root.querySelector('div#use_case')?.innerText;
  const product_icon = root.querySelector('img.taaft_icon')?.attributes['src'];
  const product_link = root.querySelector('a#ai_top_link')?.attributes['href'];
  const product_saves = root.querySelector('div.saves')?.innerText;
  const main_category = root.querySelector('a.task_label')?.innerText.trim();
  const tags = root.querySelectorAll('a.tag').flatMap((item) => item.innerText);
  const pros = root.querySelectorAll('div.pac-info-item-pros>div').flatMap((item) => item.innerText);
  const cons = root.querySelectorAll('div.pac-info-item-cons>div').flatMap((item) => item.innerText);
  const comments = root.querySelector('a.comments')?.innerText;
  const launch = root.querySelector('span.launch_date_top')?.innerText;
  const screenshot = root.querySelector('img.ai_image')?.attributes['src'];
  const faqs = root.querySelectorAll('div.faq-info').flatMap((item) => ({
    question: item.querySelector('div.faq-info-title')?.innerText || null,
    answer: item.querySelector('div.faq-info-description')?.innerText || null
  }))
  const related = root.querySelector('div.box:has(h2#recommendations)');
  const related_products = related?.querySelectorAll('div.li_row').flatMap((item) => {
      const icon = item.querySelector('.li_left img');
      const taaft_link = item.querySelector('.ai_link');
      const product_name = taaft_link?.innerText;
      const product_link = item.querySelector('a.external_ai_link')?.attributes['href'];
      return {
        icon: icon?.attributes['src'] || null,
        name: product_name || null,
        website: removeTAAFTQueryParams(product_link) || null,
        taaft_url: removeTAAFTQueryParams('https://theresanaiforthat.com' + taaft_link?.attributes['href']) || null
      }
  }) || [];
  assert(product_name && product_name.length > 0, `product_name is empty | null | undefined`);
  assert(product_tagline && product_tagline.length > 0);
  assert(product_link);
  assert(description && description.length > 0);
  assert(launch);

  return {
    name: product_name,
    tagline: product_tagline,
    website: removeTAAFTQueryParams(product_link),
    thumb_url: product_icon || null,
    main_category: main_category || null,
    description: description,
    savesCount: Number(product_saves || 0),
    commentsCount: Number(comments || 0),
    added_at: convertToDate(launch).toISOString(),
    screenshot: screenshot || null,
    related: related_products,
    pros: pros,
    cons: cons,
    tags: tags,
    faqs: faqs,
    itemType: "taaft"
  }
}