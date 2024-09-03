/** @odoo-module */

import { registry } from "@web/core/registry";
import { loadJS } from "@web/core/assets";
const { Component, onWillStart, useRef, onMounted, useEffect, onWillUnmount } = owl;

export class DateChart extends Component {
    setup() {
        this.chartRef = useRef("chart");

        onWillStart(async () => {
            await loadJS("https://cdn.amcharts.com/lib/5/index.js");
            await loadJS("https://cdn.amcharts.com/lib/5/xy.js");
            await loadJS("https://cdn.amcharts.com/lib/5/themes/Animated.js");
        });

        useEffect(() => {
            if (this.props.config && this.props.config.data) {
                this.renderChart();
            }
        }, () => [this.props.config]);

        onMounted(() => this.renderChart());

        onWillUnmount(() => {
            if (this.root) {
                this.root.dispose();
            }
        });
    }

    renderChart() {
        if (!this.chartRef.el || !this.props.config || !this.props.config.data) {
            return;
        }

        if (this.root) {
            this.root.dispose();
        }

        this.root = am5.Root.new(this.chartRef.el);

        this.root.setThemes([
            am5themes_Animated.new(this.root)
        ]);

        let chart = this.root.container.children.push(am5xy.XYChart.new(this.root, {
            panX: true,
            panY: true,
            wheelX: "panX",
            wheelY: "zoomX",
            pinchZoomX: true,
            paddingLeft: 0,
            paddingRight: 1,
            focusable: true,
        }));

        let cursor = chart.set("cursor", am5xy.XYCursor.new(this.root, {
            behavior: "none"
        }));
        cursor.lineY.set("visible", false);

        let xAxis = chart.xAxes.push(am5xy.DateAxis.new(this.root, {
            maxDeviation: 0.1,
            groupData: false,
            baseInterval: {
                timeUnit: "day",
                count: 1
            },
            renderer: am5xy.AxisRendererX.new(this.root, {
                minorGridEnabled: true,
                minGridDistance: 70
            }),
            tooltip: am5.Tooltip.new(this.root, {})
        }));

        let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(this.root, {
            maxDeviation: 0.2,
            renderer: am5xy.AxisRendererY.new(this.root, {})
        }));

        let series = chart.series.push(am5xy.LineSeries.new(this.root, {
            minBulletDistance: 10,
            connect: false,
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: this.props.config.label_value,
            valueXField: this.props.config.label_category,
            tooltip: am5.Tooltip.new(this.root, {
                pointerOrientation: "horizontal",
                labelText: "{valueY}"
            })
        }));

        series.fills.template.setAll({
            fillOpacity: 0.2,
            visible: true
        });

        series.strokes.template.setAll({
            strokeWidth: 2
        });

        series.data.processor = am5.DataProcessor.new(this.root, {
            dateFormat: "yyyy-MM-dd",
            dateFields: ["date"]
        });

        let data = this.props.config.data;

        xAxis.data.setAll(data);
        series.data.setAll(data);

        series.bullets.push(() => {
            let circle = am5.Circle.new(this.root, {
                radius: 4,
                fill: this.root.interfaceColors.get("background"),
                stroke: series.get("fill"),
                strokeWidth: 2
            });

            return am5.Bullet.new(this.root, {
                sprite: circle
            });
        });

        chart.set("scrollbarX", am5.Scrollbar.new(this.root, {
            orientation: "horizontal"
        }));

        series.appear(1000);
        chart.appear(1000, 100);
    }
}

DateChart.template = "owl_dashboard.DateChart";
