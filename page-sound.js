// This function also runs inside locally authored srcdoc players. Keep it self-contained.
export function installPageSound(win, initialMute = false, embedded = false) {
    const key = '__jianshePageSound_v1';
    const channel = 'jianshe:page-sound:1';
    if (win[key]) return win[key];
    const doc = win.document;
    const cleanup = [];
    const forced = new Map();
    const playing = new Set();
    const frames = new Map();
    const roots = new Map();
    const outputs = new Map();
    let muted = initialMute;
    let disposed = false;

    function patch(object, name, descriptor, retainOnDispose = () => false) {
        const original = object && Object.getOwnPropertyDescriptor(object, name);
        if (!original?.configurable) return;
        Object.defineProperty(object, name, { ...original, ...descriptor });
        const undo = () => {
            const current = Object.getOwnPropertyDescriptor(object, name);
            if (Object.keys(descriptor).every(k => current?.[k] === descriptor[k])) {
                Object.defineProperty(object, name, original);
            }
        };
        cleanup.push(() => { if (!retainOnDispose()) undo(); });
        return undo;
    }

    const mediaProto = win.HTMLMediaElement.prototype;
    const nativeMute = Object.getOwnPropertyDescriptor(mediaProto, 'muted');
    function silence(media) {
        if (!muted || !nativeMute) return;
        if (!forced.has(media)) forced.set(media, nativeMute.get.call(media));
        if (!nativeMute.get.call(media)) nativeMute.set.call(media, true);
    }
    // Keep the player's own mute switch independent of the page switch.
    if (nativeMute) patch(mediaProto, 'muted', {
        get() { return forced.has(this) ? forced.get(this) : nativeMute.get.call(this); },
        set(value) {
            if (muted) forced.set(this, Boolean(value));
            nativeMute.set.call(this, muted || value);
        },
    });
    function forgetPlaying(event) {
        const media = event.currentTarget;
        if (!media.paused && !media.ended) return;
        playing.delete(media);
        media.removeEventListener('pause', forgetPlaying);
        media.removeEventListener('ended', forgetPlaying);
    }
    function track(media) {
        silence(media);
        if (playing.has(media)) return;
        playing.add(media);
        media.addEventListener('pause', forgetPlaying);
        media.addEventListener('ended', forgetPlaying);
    }
    // Cards frequently use new Audio() without attaching it to the document.
    const play = mediaProto.play;
    patch(mediaProto, 'play', { value: function (...args) {
        track(this);
        const result = play.apply(this, args);
        result?.catch(() => forgetPlaying({currentTarget:this}));
        return result;
    } });

    // Put a gain control immediately before each live Web Audio output.
    // Connections to analysers, recorders and offline renders retain their original routes.
    const nodes = win.AudioNode?.prototype;
    if (nodes) {
        const connect = nodes.connect;
        const disconnect = nodes.disconnect;
        const routed = new WeakMap();
        function forgetOutput(event) {
            const ctx = event.currentTarget;
            if (ctx.state !== 'closed') return;
            outputs.delete(ctx);
            ctx.removeEventListener('statechange', forgetOutput);
        }
        patch(nodes, 'connect', { value: function (target, ...ports) {
            const ctx = this.context;
            if (target !== ctx.destination || typeof ctx.close !== 'function') {
                return connect.call(this, target, ...ports);
            }
            let gain = outputs.get(ctx);
            if (!gain) {
                gain = ctx.createGain();
                gain.gain.value = muted ? 0 : 1;
                connect.call(gain, target);
                outputs.set(ctx, gain);
                routed.set(ctx, gain);
                ctx.addEventListener('statechange', forgetOutput);
            }
            connect.call(this, gain, ...ports);
            return target;
        } });
        patch(nodes, 'disconnect', { value: function (...args) {
            const gain = routed.get(this.context);
            if (!gain || args[0] !== this.context.destination) return disconnect.apply(this, args);
            // A graph created before activation can have a direct connection as well.
            try {
                disconnect.call(this, gain, ...args.slice(1));
            } catch (error) {
                if (error.name !== 'InvalidAccessError') throw error;
                return disconnect.apply(this, args);
            }
            try { disconnect.apply(this, args); }
            catch (error) { if (error.name !== 'InvalidAccessError') throw error; }
        } }, () => outputs.size > 0);
        cleanup.push(() => {
            for (const [ctx, gain] of outputs) {
                gain.gain.value = 1;
                ctx.removeEventListener('statechange', forgetOutput);
            }
            // Existing graphs keep a unity gain. Their disconnect wrapper only
            // retains weak references, and new graphs take the native path.
        });
    }

    function sourceWithBridge(value) {
        if (typeof value !== 'string' || !value.trim() || value.includes('data-jianshe-sound-bridge')) return value;
        const body = '(' + installPageSound.toString() + ')(window,' + muted + ',true);';
        const script = '<script data-jianshe-sound-bridge>' + body.replace(/<\/script/gi, '<\\/script') + '<' + '/script>';
        // Preserve the doctype and head metadata (including the card's CSP).
        const firstScript = value.search(/<script\b/i);
        const headEnd = value.search(/<\/head\s*>|<body\b/i);
        const doctype = value.match(/^\s*<!doctype[^>]*>/i);
        const at = firstScript >= 0 && (headEnd < 0 || firstScript < headEnd) ? firstScript
            : headEnd >= 0 ? headEnd : doctype?.[0].length || 0;
        return value.slice(0, at) + script + value.slice(at);
    }

    const frameProto = win.HTMLIFrameElement?.prototype;
    const srcdoc = frameProto && Object.getOwnPropertyDescriptor(frameProto, 'srcdoc');
    if (srcdoc?.set) patch(frameProto, 'srcdoc', {
        set(value) { srcdoc.set.call(this, sourceWithBridge(value)); },
    });
    const setAttribute = win.Element.prototype.setAttribute;
    patch(win.Element.prototype, 'setAttribute', { value: function (name, value) {
        if (this.localName === 'iframe' && String(name).toLowerCase() === 'srcdoc') value = sourceWithBridge(value);
        return setAttribute.call(this, name, value);
    } });

    function connectFrame(frame, item) {
        const child = frame.contentWindow;
        if (!child) return;
        try {
            if ((!frame.hasAttribute('sandbox') || frame.sandbox.contains('allow-same-origin')) && frame.contentDocument) {
                const controller = installPageSound(child, muted);
                item.controller = controller;
                controller.setMuted(muted);
                return;
            }
        } catch { /* An external document owns its audio. */ }
        item.controller = null;
        if (frame.hasAttribute('srcdoc') && frame.srcdoc.includes('data-jianshe-sound-bridge')) {
            child.postMessage({type:channel, muted}, '*');
        }
    }
    function addFrame(frame, newlyInserted) {
        if (frames.has(frame)) return;
        // Parser-created frames (innerHTML) skip both JavaScript attribute setters.
        // Only prepare newly inserted documents; never reload an existing player to mute it.
        if (newlyInserted && frame.hasAttribute('srcdoc')) {
            const raw = frame.srcdoc;
            const withBridge = sourceWithBridge(raw);
            if (raw !== withBridge) srcdoc?.set.call(frame, withBridge);
        }
        const item = {controller:null, load:() => connectFrame(frame, item)};
        frames.set(frame, item);
        frame.addEventListener('load', item.load);
        connectFrame(frame, item);
    }
    function onMessage(event) {
        if (event.data?.type !== channel) return;
        if (embedded && event.source === win.parent && typeof event.data.muted === 'boolean') {
            setMuted(event.data.muted);
        } else if (event.data.ready === true) {
            for (const [frame, item] of frames) if (frame.contentWindow === event.source) connectFrame(frame, item);
        }
    }
    win.addEventListener('message', onMessage);
    cleanup.push(() => win.removeEventListener('message', onMessage));

    function scan(node, fresh) {
        if (![1,9,11].includes(node.nodeType)) return;
        if (node.localName === 'iframe') addFrame(node, fresh);
        if (node instanceof win.HTMLMediaElement) silence(node);
        const selector = muted ? 'iframe,audio,video' : 'iframe';
        for (const el of node.querySelectorAll(selector)) {
            if (el.localName === 'iframe') addFrame(el, fresh);
            else silence(el);
        }
    }
    function observe(root) {
        if (roots.has(root)) return;
        function handleMedia(event) {
            if (event.target instanceof win.HTMLMediaElement) silence(event.target);
        }
        for (const name of ['play','playing','volumechange','loadedmetadata']) root.addEventListener(name, handleMedia, true);
        const observer = new win.MutationObserver(records => {
            let removed = false;
            for (const record of records) {
                for (const node of record.addedNodes) scan(node, true);
                if (record.removedNodes.length) removed = true;
            }
            if (!removed) return;
            for (const [media, wanted] of forced) if (!media.isConnected && media.paused && !playing.has(media)) {
                nativeMute.set.call(media, wanted);
                forced.delete(media);
            }
            for (const [frame, item] of frames) if (!frame.isConnected) {
                frame.removeEventListener('load', item.load);
                frames.delete(frame);
            }
            for (const [shadow, detach] of roots) if (shadow.host && !shadow.host.isConnected) {
                detach();
                roots.delete(shadow);
            }
        });
        roots.set(root, () => {
            observer.disconnect();
            for (const name of ['play','playing','volumechange','loadedmetadata']) root.removeEventListener(name, handleMedia, true);
        });
        observer.observe(root, {childList:true, subtree:true});
        scan(root, false);
    }
    const attachShadow = win.Element.prototype.attachShadow;
    if (attachShadow) patch(win.Element.prototype, 'attachShadow', { value: function (...args) {
        const shadow = attachShadow.apply(this, args);
        if (shadow.mode === 'open') observe(shadow);
        return shadow;
    } });

    function setMuted(value) {
        if (disposed || muted === value) return;
        muted = value;
        if (muted) {
            for (const media of playing) silence(media);
            for (const root of roots.keys()) scan(root, false);
        } else {
            for (const [media, wanted] of forced) nativeMute.set.call(media, wanted);
            forced.clear();
        }
        for (const gain of outputs.values()) gain.gain.value = muted ? 0 : 1;
        for (const [frame, item] of frames) connectFrame(frame, item);
    }
    const controller = {get muted() { return muted; }, setMuted, dispose() {
        if (disposed) return;
        setMuted(false);
        disposed = true;
        for (const [frame, item] of frames) {
            frame.removeEventListener('load', item.load);
            item.controller?.dispose();
        }
        for (const media of playing) {
            media.removeEventListener('pause', forgetPlaying);
            media.removeEventListener('ended', forgetPlaying);
        }
        for (const detach of roots.values()) detach();
        for (const undo of cleanup.reverse()) undo();
        frames.clear(); roots.clear(); playing.clear(); outputs.clear();
        delete win[key];
    }};
    Object.defineProperty(win, key, {value:controller, configurable:true});
    observe(doc);
    for (const el of doc.querySelectorAll('*')) if (el.shadowRoot) observe(el.shadowRoot);
    if (embedded) win.parent.postMessage({type:channel, ready:true}, '*');
    return controller;
}
