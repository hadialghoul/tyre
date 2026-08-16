const ID_KEY = 'tyre-deleted-ids';
const NAME_KEY = 'tyre-deleted-names';

const readList = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.map(String) : [];
  } catch (err) {
    return [];
  }
};

export const getDeletedIds = () => readList(ID_KEY);
export const getDeletedNames = () => readList(NAME_KEY);

export const rememberDeleted = (id, name) => {
  const ids = getDeletedIds();
  const names = getDeletedNames();
  if (id && !ids.includes(String(id))) ids.push(String(id));
  if (name && !names.some((item) => item.toLowerCase() === String(name).toLowerCase())) {
    names.push(String(name));
  }
  localStorage.setItem(ID_KEY, JSON.stringify(ids));
  localStorage.setItem(NAME_KEY, JSON.stringify(names));
};

export const filterDeleted = (list = []) => {
  const ids = new Set(getDeletedIds());
  const names = new Set(getDeletedNames().map((item) => item.toLowerCase()));
  if (!ids.size && !names.size) return list;
  return list.filter(
    (item) =>
      !ids.has(String(item._id)) &&
      !names.has(String(item.name || '').toLowerCase())
  );
};
