import { ParamValue } from "common/models/Params";
import { FunctionComponent, LazyExoticComponent } from "react";

type PageConfig = {
  readonly url: string;
  readonly title: string;
  readonly version?: number;
  readonly initialState?: Record<string, ParamValue>;
  readonly component: LazyExoticComponent<FunctionComponent>;
  readonly description: string;
};

export default PageConfig;
