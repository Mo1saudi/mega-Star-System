async function inspectSheet() {
  const sheetId = '1yJy9OeGP9uyHzzh35gUVYyXS8aRi41UM6Fg0LrWtsrU';
  
  // Try gviz tq endpoint to list sheets or fetch htmlview
  const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/edit`);
  const html = await res.text();
  
  // Look for bootstrap data
  const sheetDataMatch = html.match(/var bootstrapData = (\{.*?\});/);
  if (sheetDataMatch) {
    console.log("Found bootstrapData");
  } else {
    // Find all gids and sheet names in script tags
    const gidMatches = [...html.matchAll(/"(\d{1,10})":\{\s*"name":"([^"]+)"/g)];
    console.log("GID name matches:", gidMatches.map(m => ({ gid: m[1], name: m[2] })));
  }

  // Also check gviz URL with sheet names or try common sheet names / gids
  const gids = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 123456, 999];
  for (const gid of gids) {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    try {
      const csvRes = await fetch(csvUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (csvRes.ok) {
        const text = await csvRes.text();
        if (text && text.trim().length > 10 && !text.includes('<!DOCTYPE html>')) {
          console.log(`\n=== GID ${gid} ===`);
          console.log(text.split('\n').slice(0, 5).join('\n'));
        }
      }
    } catch (e) {}
  }
}

inspectSheet().catch(console.error);
