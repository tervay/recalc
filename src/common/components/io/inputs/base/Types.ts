export interface InputID {
  id?: string;
}

export interface NumericSelectIDs extends InputID {
  numericId?: string;
  selectId?: string;
}

export interface Styleable {
  disabled?: boolean;
  expanded?: boolean;
  roundTo?: number;
}
