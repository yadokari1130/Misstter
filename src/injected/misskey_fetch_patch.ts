const initMisskeyFetchPatch = () => {
    if ((window as any).__misstter_fetch_patch_installed) return;
    (window as any).__misstter_fetch_patch_installed = true;
    
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
        const url = args[0] as string | URL | Request;
        const requestUrl = typeof url === 'string' ? url : (url instanceof URL ? url.toString() : url.url);

        const isCreateTweet = requestUrl.includes('/i/api/graphql/') && requestUrl.includes('/CreateTweet');

        const response = await originalFetch.apply(window, args);

        if (isCreateTweet) {
            try {
                const clonedResponse = response.clone();
                const json = await clonedResponse.json();
                
                const tweetResult = json?.data?.create_tweet?.tweet_results?.result;
                const restId = tweetResult?.rest_id;

                if (restId) {
                    window.postMessage({
                        type: 'MISSTTER_TWEET_CREATED',
                        tweetId: restId,
                    }, '*');
                }
            } catch (err) {
                console.error('[Misstter] Error parsing CreateTweet response:', err);
            }
        }

        return response;
    };
    
    const originalXHR = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method: string, url: string | URL) {
        const requestUrl = typeof url === 'string' ? url : url.toString();
        if (requestUrl.includes('/i/api/graphql/') && requestUrl.includes('/CreateTweet')) {
            this.addEventListener('load', function(this: XMLHttpRequest) {
                try {
                    const json = JSON.parse(this.responseText);
                    const tweetResult = json?.data?.create_tweet?.tweet_results?.result;
                    const restId = tweetResult?.rest_id;
                    if (restId) {
                        window.postMessage({
                            type: 'MISSTTER_TWEET_CREATED',
                            tweetId: restId,
                        }, '*');
                    }
                } catch(e) {}
            });
        }
        return originalXHR.apply(this, arguments as any);
    };
};

initMisskeyFetchPatch();
