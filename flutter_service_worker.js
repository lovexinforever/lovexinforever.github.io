'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "version.json": "6a141a2a4082d9cb2bd141d9fdf17882",
"index.html": "41abf7126c12becc0623f2cc1834f389",
"/": "41abf7126c12becc0623f2cc1834f389",
"main.dart.js": "acee19361cf5c8ebd5146dae5aaf9e2b",
"favicon.png": "5dcef449791fa27946b3d35ad8803796",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"manifest.json": "61533b8ac6165bbd576cec50c4afce26",
"assets/AssetManifest.json": "f1c7aa34fba124dc03ab60193d372a84",
"assets/NOTICES": "e6876bf40c8eef8134f4056db174bc0a",
"assets/FontManifest.json": "dc3d03800ccca4601324923c0b1d6d57",
"assets/packages/cupertino_icons/assets/CupertinoIcons.ttf": "6d342eb68f170c97609e9da345464e5e",
"assets/fonts/MaterialIcons-Regular.otf": "4e6447691c9509f7acdbf8a931a85ca1",
"assets/assets/images/icon_close.png": "1acf3d5a01a107fea603a5900531cdf9",
"assets/assets/images/icon_search.png": "f35d3d22fff8e4308670e6c8ae15a3dd",
"assets/assets/images/2.0x/icon_close.png": "eb6307e40bae41e3a3564b71a75d5d93",
"assets/assets/images/2.0x/icon_search.png": "d07f314723c4dc0ee9d661bfd8023e63",
"assets/assets/images/2.0x/bg_split.png": "06a97c24f8c8235b9d8d369489ef9e42",
"assets/assets/images/2.0x/icon_menu.png": "234cbbee3563ee2abaeab24d0602cd02",
"assets/assets/images/2.0x/logo_title.png": "ca86e505c803ffaf3e38bbf85cdbee0f",
"assets/assets/images/2.0x/icon_fret_right.png": "0bb016d6e1bef3da7328856aeab60046",
"assets/assets/images/2.0x/icon_fret_left.png": "d26ecf79e584cb7f887582b3c0037fa4",
"assets/assets/images/bg_split.png": "f545b9158665f61c57f4be010697f15d",
"assets/assets/images/icon_menu.png": "af0b66ec863d8413ab378c4335f79477",
"assets/assets/images/logo_title.png": "b8a1ae1c78a110f7ecdc679c5cda0772",
"assets/assets/images/3.0x/icon_close.png": "8e3c5eb1f90f8227435d31225d32131b",
"assets/assets/images/3.0x/icon_search.png": "58de85f3bafacab5f6a69751895b13f9",
"assets/assets/images/3.0x/bg_split.png": "a10eef20f3f22cc7a45ce4578d0259c2",
"assets/assets/images/3.0x/icon_menu.png": "ced1a1867ff3546934e48d2f112007dc",
"assets/assets/images/3.0x/logo_title.png": "dc2c512b9c99395b551baf5a8f3d5e36",
"assets/assets/images/3.0x/icon_fret_right.png": "27c5a6b58ecf8b65a9f1e5de3424a681",
"assets/assets/images/3.0x/icon_fret_left.png": "ff015c7a7911d4e5072c6b039d5465e3",
"assets/assets/images/icon_fret_right.png": "69b8ebecb0d92e637958bbc7e5abfb6a",
"assets/assets/images/icon_fret_left.png": "6243198272f43b30fdf792f4009dabcd"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
  "/",
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
