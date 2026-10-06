const DATA_ROOT = './data/public';

async function getJSON(path){
  const r = await fetch(`${DATA_ROOT}/${path}`);
  if(!r.ok) throw new Error(`HTTP ${r.status}: ${path}`);
  return r.json();
}

function el(tag, attrs={}, text=''){
  const node=document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{
    if(k==='class') node.className=v;
    else node.setAttribute(k,v);
  });
  if(text) node.textContent=text;
  return node;
}

async function renderCategories(targetId){
  const target=document.getElementById(targetId);
  if(!target) return;
  const data=await getJSON('categories.json');
  data.categories
    .filter(c=>c.showInMainNav)
    .sort((a,b)=>a.navOrder-b.navOrder)
    .forEach(c=>{
      const a=el('a',{href:`catalog.html?category=${encodeURIComponent(c.id)}`,class:'card'});
      const media=el('div',{class:'card-media'},c.title);
      const title=el('div',{class:'card-title'},c.title);
      a.append(media,title); target.append(a);
    });
}

async function renderCatalog(){
  const grid=document.getElementById('catalog-grid');
  if(!grid) return;
  const search=document.getElementById('catalog-search');
  const params=new URLSearchParams(location.search);
  const category=params.get('category');
  const data=await getJSON('catalog-index.json');

  function draw(){
    const q=(search?.value||'').trim().toLowerCase();
    const rows=data.products.filter(p =>
      p.visibility!=='hidden_replaced_by_series' &&
      (!category || p.categoryId===category) &&
      (!q || p.searchText.includes(q))
    );
    grid.replaceChildren();
    rows.forEach(p=>{
      const a=el('a',{href:`product.html?id=${encodeURIComponent(p.id)}`,class:'card'});
      a.append(
        el('div',{class:'card-media'},'Фото готовится'),
        el('div',{class:'card-title'},p.title)
      );
      grid.append(a);
    });
    const count=document.getElementById('catalog-count');
    if(count) count.textContent=`Найдено: ${rows.length}`;
  }
  search?.addEventListener('input',draw);
  draw();
}

async function renderProduct(){
  const root=document.getElementById('product-root');
  if(!root) return;
  const id=new URLSearchParams(location.search).get('id');
  if(!id) return;
  const data=await getJSON('catalog.json');
  const p=data.products.find(x=>x.id===id);
  if(!p){root.textContent='Товар не найден';return;}
  document.title=`${p.title} — НовоСтрой`;
  const h=el('h1',{},p.title);
  const status=el('p',{class:'muted'},p.availability?.displayStatus || 'Цена и наличие уточняются');
  const btn=el('button',{class:'btn btn-primary',type:'button'},'Уточнить цену и наличие');
  const desc=el('p',{},p.description?.short || '');
  root.append(h,status,btn,desc);

  if(Array.isArray(p.variants) && p.variants.length){
    root.append(el('h2',{},'Варианты'));
    const wrap=el('div',{class:'actions'});
    p.variants.forEach(v=>wrap.append(el('button',{class:'btn',type:'button'},v.name || v.id)));
    root.append(wrap);
  }

  if(p.specs && Object.keys(p.specs).length){
    root.append(el('h2',{},'Характеристики'));
    const dl=el('dl');
    Object.entries(p.specs).forEach(([k,v])=>{
      dl.append(el('dt',{},k), el('dd',{},typeof v==='object'?JSON.stringify(v):String(v)));
    });
    root.append(dl);
  }
}
