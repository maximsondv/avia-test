import {Component, OnInit} from '@angular/core';
import {DataService} from "../../services/data.service";
import {BehaviorSubject, combineLatest, map, Observable} from "rxjs";
import {FormArray, FormBuilder, FormControl, FormGroup} from "@angular/forms";
import * as moment from 'moment';
import {Ticket} from "../../models/ticket";
import {Segment} from "../../models/segment";
import {Company} from "../../models/company";
import {Filters} from "../../models/filters";

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  tickets$: Observable<Ticket[]>;
  filtersForm: FormGroup;
  private readonly selectedFilters = new BehaviorSubject<Filters | null>(null);
  private readonly totalPages = new BehaviorSubject<number>(1);
  stopsOptions = [
    {label: 'Все', value: 'all'},
    {label: 'Без Пересадок', value: 0},
    {label: '1 пересадка', value: 1},
    {label: '2 пересадки', value: 2},
    {label: '3 пересадки', value: 3},
  ];

  constructor(private dataService: DataService, private fb: FormBuilder) {
  }

  ngOnInit(): void {
    this.filtersForm = this.fb.group({
      stops: new FormArray([]),
      company: null,
      sort: 'cheapest'
    });

    this.stopsOptions.forEach(() => this.stopsFormArray.push(new FormControl(false)));
    this.filtersForm.valueChanges
      .pipe(map(filters => {
        filters.stops = filters.stops
          .map((checked: boolean, i: number) => checked ? this.stopsOptions[i].value : null)
          .filter((v: any) => v !== null);
        return filters
      }))
      .subscribe(data => {
        this.selectedFilters.next(data);
      })

    this.tickets$ = combineLatest([
      this.dataService.getTickets(),
      this.dataService.getCompanies(),
      this.dataService.getSegments(),
      this.selectedFilters,
      this.totalPages
    ])
      .pipe(
        map(([ticketsDTO, companiesDTO, segmentsDTO, selectedFilters, totalPages]) => {
          let tickets: Ticket[] = [...ticketsDTO];
          if (selectedFilters?.sort === 'cheapest') {
            tickets.sort((a: Ticket, b: Ticket) => a.price - b.price)
          }
          if (selectedFilters?.sort === 'fastest') {
            tickets.sort((a: Ticket, b: Ticket) => {
              return a.segmentsInfo!.reduce((prev: number, curr: Segment) => prev + curr.duration, 0) - b.segmentsInfo!.reduce((prev: any, curr: any) => prev + curr.duration, 0)
            })
          }
          if (selectedFilters?.sort === 'optimal') {
            tickets.sort((a: Ticket, b: Ticket) => {
              return a.segmentsInfo!.reduce((prev: number, curr: Segment) => prev + curr.stops.length, 0) - b.segmentsInfo!.reduce((prev: any, curr: any) => prev + curr.stops.length, 0)
            })
          }
          if (selectedFilters?.company && selectedFilters?.company !== 'all') {
            tickets = tickets.filter(ticket => ticket.companyInfo!.name === selectedFilters.company)
          }
          if (selectedFilters?.stops.length && !selectedFilters.stops.includes('all')) {
            tickets = tickets.filter(ticket => {
                const totalStops = ticket.segmentsInfo!.reduce((prev: number, curr: Segment) => {
                  return prev + curr.stops.length
                }, 0)
                return selectedFilters.stops.includes(totalStops);
              }
            )
          }
          tickets.forEach((ticket: Ticket) => {
            ticket.companyInfo = companiesDTO.find((company: Company) => ticket.companyId === company.id);
            ticket.segmentsInfo = ticket.segments.map((segmentId: string) => {
              return segmentsDTO.find((segment: Segment) => segmentId === segment.id)
            }) ?? [];

            ticket.segmentsInfo = ticket.segmentsInfo?.map((segment: Segment) => {
              return Object.assign(segment,
                {
                  convertedDuration: `${moment.duration(segment.duration).hours()}ч ${moment.duration(segment.duration).minutes()}м`,
                  convertedStartDate: `${moment.utc(moment.duration(segment.dateStart).as('milliseconds')).format('HH:mm')}`,
                  convertedEndDate: `${moment.utc(moment.duration(segment.dateEnd).as('milliseconds')).format('HH:mm')}`
                })
            })
          })
          return tickets.splice(0, totalPages * 5)
        }))

  }


  showMore(): void {
    this.totalPages.next(this.totalPages.getValue() + 1)
  }

  get stopsFormArray(): FormArray {
    return this.filtersForm.controls['stops'] as FormArray;
  }

}
