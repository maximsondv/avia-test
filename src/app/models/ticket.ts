import {Segment} from "./segment";
import {Company} from "./company";

export interface Ticket {
  id: string;
  price: number;
  companyId: string;
  segments: string[];
  segmentsInfo?: Segment[] | undefined;
  companyInfo?: Company;
}
