export default class PageConfig {
  constructor({
    url,
    image,
    title,
    version,
    initialState,
    component,
    description,
  }) {
    this.url = url;
    this.image = image;
    this.title = title;
    this.version = version;
    this.initialState = initialState;
    this.component = component;
    this.description = description;

    for (const prop in this) {
      if (arguments[0][prop] === undefined) {
        console.warn(`Unable to find ${prop} for ${url}`);
      }
    }
  }
}
