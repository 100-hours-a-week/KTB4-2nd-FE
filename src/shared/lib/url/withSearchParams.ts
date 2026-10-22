type SearchParamsRecord = Record<string, string | string[] | undefined>;

export function withSearchParams(path: string, searchParams: SearchParamsRecord) {
  const params = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.append(key, value);
  });
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}
