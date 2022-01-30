import {HttpClient} from "@angular/common/http";
import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {Ticket} from "../models/ticket";
import {Company} from "../models/company";
import {Segment} from "../models/segment";

@Injectable({
  providedIn: 'root'
})

export class DataService {

  constructor(private http: HttpClient) {
  }

  public getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>('./assets/tickets.json')
  }

  public getCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>('./assets/companies.json')
  }

  public getSegments(): Observable<any> {
    return this.http.get('./assets/segments.json')
  }
}
