type AdminItem = { name?: string; adminLevel?: number };

/**
 * 逆地理编码：将经纬度转换为「xx市xx区」格式
 * 使用 BigDataCloud 免费 API，对中国地址支持较好
 */
export async function reverseGeocodeToCityDistrict(lat: number, lon: number): Promise<string> {
  const coordFallback = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`;
    const res = await fetch(url);
    if (!res.ok) return coordFallback;

    const data = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
      localityInfo?: { administrative?: AdminItem[] };
    };

    // 优先使用顶层字段
    let city = data.city ?? data.principalSubdivision ?? "";
    let district = data.locality ?? "";

    // 若为空，从 localityInfo.administrative 提取（adminLevel 4≈省/市，6≈区/县）
    if ((!city || !district) && data.localityInfo?.administrative?.length) {
      const adm = data.localityInfo.administrative;
      const cityItem = adm.find((a) => a.adminLevel === 4 || a.adminLevel === 5) ?? adm[1];
      const districtItem = adm.find((a) => a.adminLevel === 6 || a.adminLevel === 8);
      if (!city && cityItem?.name) city = cityItem.name;
      if (!district && districtItem?.name) district = districtItem.name;
    }

    if (city && district) return `${city}${district}`;
    if (city) return city;
    if (district) return district;
    if (data.countryName) return data.countryName;

    return coordFallback;
  } catch {
    return (await tryNominatim(lat, lon)) ?? coordFallback;
  }
}

async function tryNominatim(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh`;
    const res = await fetch(url, {
      headers: { "User-Agent": "LZYDiary/1.0 (personal diary)" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: Record<string, string> };
    const a = data?.address;
    if (!a) return null;
    const city = a.city ?? a.town ?? a.village ?? a.state ?? a.province ?? "";
    const district = a.county ?? a.district ?? "";
    if (city && district) return `${city}${district}`;
    if (city) return city;
    if (district) return district;
    return a.country ?? null;
  } catch {
    return null;
  }
}
