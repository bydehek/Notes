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
  data.categories.filter(c=>c.showInMainNav).sort((a,b)=>a.navOrder-b.navOrder).forEach(c=>{
    const a=el('a',{href:`catalog.html?category=${encodeURIComponent(c.id)}`,class:'card'});
    a.append(el('div',{class:'card-media'},c.title),el('div',{class:'card-title'},c.title));
    target.append(a);
  });
}
async function renderCatalog(){
  const grid=document.getElementById('catalog-grid');
  if(!grid) return;
  const search=document.getElementById('catalog-search');
  const category=new URLSearchParams(location.search).get('category');
  const data=await getJSON('catalog-index.json');
  function draw(){
    const q=(search?.value||'').trim().toLowerCase();
    const rows=data.products.filter(p =>
      p.visibility!=='hidden_replaced_by_series' &&
      (!category || p.categoryId===category) &&
      (!q || [p.title,p.brand].filter(Boolean).join(' ').toLowerCase().includes(q))
    );
    grid.replaceChildren();
    rows.forEach(p=>{
      const a=el('a',{href:`product.html?id=${encodeURIComponent(p.id)}`,class:'card'});
      a.append(el('div',{class:'card-media'},'Фото готовится'),el('div',{class:'card-title'},p.title));
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
  const data=await getJSON('catalog-index.json');
  const p=data.products.find(x=>x.id===id);
  if(!p){root.textContent='Товар не найден';return;}
  document.title=`${p.title} — НовоСтрой`;
  root.append(
    el('h1',{},p.title),
    el('p',{class:'muted'},p.brand ? `Бренд: ${p.brand}` : 'Комплектное решение НовоСтроя'),
    el('p',{},'Цена и наличие уточняются у менеджера. Подробные характеристики и варианты постепенно подключаются к публичной карточке.'),
    el('a',{class:'btn btn-primary',href:'tel:+73467388815'},'Уточнить цену и наличие')
  );
}