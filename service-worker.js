async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open("modulePlaner_cache");
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        return cachedResponse || Response.error();
    }
}

async function cacheFirstWithRefresh(request) {
    const fetchResponsePromise = fetch(request).then(async (networkResponse) => {
        if (networkResponse.ok) {
            const cache = await caches.open("modulePlaner_cache");
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    });

    return (await caches.match(request)) || (await fetchResponsePromise);
}


self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (url.pathname.match("/planer/getHtml.php")) {
        event.respondWith(networkFirst(event.request));
    } else {
        event.respondWith(cacheFirstWithRefresh(event.request));
    }
});