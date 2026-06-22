export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Serve API routes
    if (path.startsWith('/api/')) {
      const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
      }

      if (path === '/api/entries' && request.method === 'GET') {
        const data = await env.DIARY_KV.get('entries');
        return new Response(data || '[]', { headers });
      }

      if (path === '/api/entries' && request.method === 'POST') {
        const entry = await request.json();
        const existing = JSON.parse(await env.DIARY_KV.get('entries') || '[]');
        existing.push(entry);
        await env.DIARY_KV.put('entries', JSON.stringify(existing));
        return new Response(JSON.stringify(entry), { headers });
      }

      if (path.startsWith('/api/entries/') && request.method === 'PUT') {
        const id = path.split('/')[3];
        const updated = await request.json();
        console.log('[worker PUT] id:', id, 'updated keys:', Object.keys(updated));
        const existing = JSON.parse(await env.DIARY_KV.get('entries') || '[]');
        const index = existing.findIndex(e => e.id === id);
        console.log('[worker PUT] found at index:', index, 'of', existing.length, 'entries');
        if (index !== -1) existing[index] = updated;
        await env.DIARY_KV.put('entries', JSON.stringify(existing));
        return new Response(JSON.stringify(updated), { headers });
      }

      if (path.startsWith('/api/entries/') && request.method === 'DELETE') {
        const id = path.split('/')[3];
        const existing = JSON.parse(await env.DIARY_KV.get('entries') || '[]');
        const filtered = existing.filter(e => e.id !== id);
        await env.DIARY_KV.put('entries', JSON.stringify(filtered));
        // Clean up all photos stored for this entry
        const photoList = await env.DIARY_KV.list({ prefix: `photo:${id}:` });
        await Promise.all(photoList.keys.map(k => env.DIARY_KV.delete(k.name)));
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // ── Photo routes ────────────────────────────────────────────────────────
      // KV key format: photo:{entryId}:{photoId}

      if (path.startsWith('/api/photos/')) {
        const parts = path.split('/').filter(Boolean); // ['api', 'photos', ...]

        // GET /api/photos/:entryId — returns all photos for an entry
        if (request.method === 'GET' && parts.length === 3) {
          const entryId = parts[2];
          const list = await env.DIARY_KV.list({ prefix: `photo:${entryId}:` });
          const photos = await Promise.all(
            list.keys.map(async k => {
              const data = await env.DIARY_KV.get(k.name);
              return data ? JSON.parse(data) : null;
            })
          );
          return new Response(JSON.stringify(photos.filter(Boolean)), { headers });
        }

        // POST /api/photos/:entryId — saves a single photo by its id
        if (request.method === 'POST' && parts.length === 3) {
          const entryId = parts[2];
          const photo = await request.json();
          await env.DIARY_KV.put(`photo:${entryId}:${photo.id}`, JSON.stringify(photo));
          return new Response(JSON.stringify({ success: true }), { headers });
        }

        // DELETE /api/photos/:entryId/:photoId — deletes a single photo
        if (request.method === 'DELETE' && parts.length === 4) {
          const entryId = parts[2];
          const photoId = parts[3];
          await env.DIARY_KV.delete(`photo:${entryId}:${photoId}`);
          return new Response(JSON.stringify({ success: true }), { headers });
        }
      }

      if (path === '/api/assessment-reflections' && request.method === 'GET') {
        const data = await env.DIARY_KV.get('assessment_reflections');
        return new Response(data || '{}', { headers });
      }

      if (path === '/api/assessment-reflections' && request.method === 'PUT') {
        const reflections = await request.json();
        await env.DIARY_KV.put('assessment_reflections', JSON.stringify(reflections));
        return new Response(JSON.stringify(reflections), { headers });
      }

      if (path === '/api/stickers' && request.method === 'GET') {
        const data = await env.DIARY_KV.get('stickers');
        return new Response(data || '[]', { headers });
      }

      if (path === '/api/stickers' && request.method === 'PUT') {
        const stickers = await request.json();
        await env.DIARY_KV.put('stickers', JSON.stringify(stickers));
        return new Response(JSON.stringify(stickers), { headers });
      }
    }

    // Serve static assets for everything else
    return env.ASSETS.fetch(request);
  }
};
