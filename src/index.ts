import { App, createApp, Component } from 'vue';
import hypernova, { load } from 'hypernova';
import { findNode, getData } from 'nova-helpers';
import { Plugins } from './typings';

type HypernovaPayload = {
  node: HTMLElement;
  data: Record<string, unknown>;
}

export { load } from 'hypernova';

function getAllComments(rootElem) {
  const comments: string[] = [];
  const iterator = document.createNodeIterator(
    rootElem,
    NodeFilter.SHOW_COMMENT,
  );
  let curNode;
  // eslint-disable-next-line no-cond-assign
  while (curNode = iterator.nextNode()) {
    comments.push(curNode.nodeValue);
  }
  return comments;
}

export const mountComponent = (
  component: Component,
  node: HTMLElement,
  props: Record<string, unknown>,
  plugins: Plugins = [],
): App => {
  const app = createApp(component, props);

  plugins.forEach(({
    plugin,
    options,
  }) => {
    app.use(plugin, ...options);
  });

  const comments = getAllComments(node);

  app.mount(node);

  comments.reverse().forEach((comment) => {
    node.insertBefore(document.createComment(comment), node.firstChild);
  });

  return app;
};

export const renderInPlaceholder = (
  name: string,
  component: Component,
  id: string,
): App | null => {
  const node: HTMLElement = findNode(name, id);
  const data: Record<string, unknown> = getData(name, id);

  if (node && data) {
    return mountComponent(component, node, data);
  }

  return null;
};

export const loadById = (name: string, id: string): HypernovaPayload => {
  const node = findNode(name, id);
  const data = getData(name, id);

  if (node && data) {
    return {
      node,
      data,
    };
  }

  return null;
};

export const renderVue = (name: string, component: Component): void => hypernova({
  server() {
    throw new Error('Use hypernova-vue/server instead');
  },

  client() {
    const payloads = load(name);
    if (payloads) {
      payloads.forEach((payload: HypernovaPayload) => {
        const { node, data: propsData } = payload;

        mountComponent(component, node, propsData);
      });
    }

    return component;
  },
});
