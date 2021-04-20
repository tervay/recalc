import PageConfig from "common/models/PageConfig";

describe("PageConfig", () => {
  test("Console is warned when property is missing", () => {
    const spy = jest.spyOn(console, "warn").mockImplementation();

    const _ = new PageConfig({
      url: "/myConfig",
      image: "/media/Foo.png",
      title: "Title",
    });

    expect(console.warn).toHaveBeenCalledTimes(4);
    expect(console.warn).toHaveBeenCalledWith(
      "Unable to find version for /myConfig"
    );
    expect(console.warn).toHaveBeenCalledWith(
      "Unable to find initialState for /myConfig"
    );
    expect(console.warn).toHaveBeenCalledWith(
      "Unable to find component for /myConfig"
    );
    expect(console.warn).toHaveBeenCalledWith(
      "Unable to find description for /myConfig"
    );

    spy.mockRestore();
  });
});
