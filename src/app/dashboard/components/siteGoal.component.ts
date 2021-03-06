import {Component, OnInit, Input, Output, EventEmitter, AfterViewInit} from '@angular/core';

import {AnalyticsQuery} from '../../services/analyticsquery.service';
import {DataService} from '../../services/Data.service';
import {ChartService} from '../../services/Chart.service';
import {Helper} from '../../Utils/Helper';

import {OrganicChannel} from '../../models/OrganicChannel.data';
import {Subject} from 'rxjs/Subject';

declare let d3: any;
declare let nvd3: any;

@Component({
  selector: 'siteGoal',
  templateUrl: '../pages/siteGoal.component.html',
})

export class SiteGoalComponent implements AfterViewInit {
  @Input() client_name;
  @Input() goalList;
  @Input() current_month;
  @Input() compare_month;
  @Input() compare_index_month;
  @Input() first_year;
  @Input() second_year;
  @Input() generateReport: Subject<boolean>;
  @Input() generateOldReport: Subject<boolean>;
  @Output() currentLoad: EventEmitter<any>;

  public data;
  public bar_graph: any;
  public organic;
  public retrievedData;
  public totalForSiteGoal;

  constructor(private query: AnalyticsQuery, public dataset: DataService, public helper: Helper, private chart: ChartService) {
    this.data = dataset;
    this.retrievedData = [];
    this.totalForSiteGoal = [];
    this.currentLoad = new EventEmitter<any>();
  }

  ngAfterViewInit() {
    this.generateReport.subscribe(v => {
      if (v === true) {
        this.setGoalEvents();
      }
      this.generateOldReport.subscribe((v) => {
        if (v === true) {
          this.getLastGoalEvents();
        }
      });
    });
  }

  getLastGoalEvents() {
    let result = [];
    let requests = [];
    let index = 1, i = 0;
    requests[i] = [];
    result[i] = [];
    // let ids=[];
    this.goalList.forEach(item => {
      if (index % 5 == 0) {
        i++;
        requests[i] = [];
      }
      // ids.push(item.id);
      requests[i].push(this.query.getAllGoalsParameter(item['id']));
      index++;
    });

    let promises = [];
    requests.forEach(request => {
      promises.push(this.query.getBatchGoalsParameter(request));
    });

    // conso

    Promise.all(promises).then(items => {
      let current_goalEvents = [];
      items.forEach(result => {
        current_goalEvents = current_goalEvents.concat(result.current);
        console.log(result.current);
        let reducer = (accumulator, currentValue) => accumulator + Number(currentValue[2]);

        this.dataset.setLastYear('goalCompletion', current_goalEvents.reduce(reducer, 0));
        this.dataset.setLastYear('goalConversionRate', (this.dataset.getCurrentData('goalCompletion') / this.dataset.getCurrentData('sessions')) * 100);
      });
    }, err => {
      console.log(err);
    });
  }

  setGoalEvents() {
    let result = [];
    let requests = [];
    let index = 1, i = 0;
    requests[i] = [];
    result[i] = [];
    // let ids=[];
    this.goalList.forEach(item => {
      if (index % 5 == 0) {
        i++;
        requests[i] = [];
      }
      // ids.push(item.id);
      requests[i].push(this.query.getAllGoalsParameter(item['id']));
      index++;
    });

    let promises = [];
    requests.forEach(request => {
      promises.push(this.query.getBatchGoalsParameter(request));
    });

    Promise.all(promises).then(items => {
      let current_goalEvents = [];
      let compare_goalEvents = [];
      items.forEach(result => {
        current_goalEvents = current_goalEvents.concat(result.current);
        compare_goalEvents = compare_goalEvents.concat(result.compare);

        let reducer = (accumulator, currentValue) => accumulator + Number(currentValue[2]);
        this.dataset.setCompareData('goalCompletion', compare_goalEvents.reduce(reducer, 0));
        this.dataset.setCurrentData('goalCompletion', current_goalEvents.reduce(reducer, 0));
        this.dataset.setCurrentData('goalConversionRate', (this.dataset.getCurrentData('goalCompletion') / this.dataset.getCurrentData('sessions')) * 100);
        this.dataset.setCompareData('goalConversionRate', (this.dataset.getComparedData('goalCompletion') / this.dataset.getComparedData('sessions')) * 100);
        // if(this.client_name==="tilemarket"){
        //
        // }
        //
        // console.log(compare_goalEvents);
        // console.log(current_goalEvents);

        this.dataset.setCompareData('goalEvent', compare_goalEvents);
        this.dataset.setCurrentData('goalEvents', current_goalEvents);
        if (this.goalList[0] !== null) {
          let result = current_goalEvents.find((result) => {
            return result[0].name === 'goal' + this.goalList[0]['id'] + 'Completions';
          });
          if (result !== undefined) {
            this.goalDetailsViaChannel(this.goalList[0]['id']);
          }
        }
      });
      this.currentLoad.emit({'component': 'goalEvents', 'loaded': true});
    }, err => {
      console.log(err);
    });
  }

  goalDetailsViaChannel(id) {
    this.retrievedData['current'] = this.dataset.getCurrentData('goalEvents').filter(goal => goal[0].name === 'goal' + id + 'Completions')[0][1];
    this.totalForSiteGoal['current'] = this.dataset.getCurrentData('goalEvents').filter(goal => goal[0].name === 'goal' + id + 'Completions')[0][2];
    this.totalForSiteGoal['compare'] = this.dataset.getComparedData('goalEvent').filter(goal => goal[0].name === 'goal' + id + 'Completions')[0][2];
  }
}
