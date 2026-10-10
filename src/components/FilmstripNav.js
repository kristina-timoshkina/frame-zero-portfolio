export function createFilmstripNav(items) {
  const nav = document.createElement("nav");
  nav.className = "filmstrip";
  nav.setAttribute("aria-label", "Навигация по сценам");

  const list = document.createElement("ol");
  list.className = "filmstrip__track";

  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.className = "filmstrip__item";
    const link = document.createElement("a");
    link.href = `#${item.id}`;
    link.dataset.sceneLink = item.id;
    link.setAttribute("aria-label", `${item.number} ${item.title} — перейти к сцене`);
    link.innerHTML = `
      <span class="filmstrip__perforation" aria-hidden="true"></span>
      <span class="filmstrip__frame">
        ${item.thumbnail ? `<img class="filmstrip__thumb" src="${item.thumbnail}" alt="" loading="lazy" decoding="async">` : ""}
        <span class="filmstrip__number">${item.number}</span>
        <span class="filmstrip__title">${item.title}</span>
      </span>
    `;
    if (index === 0) link.setAttribute("aria-current", "true");
    li.append(link);
    list.append(li);
  });

  nav.append(list);
  return nav;
}
