/** @odoo-module */

import { registry } from "@web/core/registry";
import { loadJS } from "@web/core/assets";
const { Component, onWillStart, useRef, onMounted, useEffect, onWillUnmount } = owl;

export class ColumnChart extends Component {
    setup() {
        this.chartRef = useRef("chart");

        onWillStart(async () => {
            await loadJS("https://cdn.amcharts.com/lib/5/index.js");
            await loadJS("https://cdn.amcharts.com/lib/5/xy.js");
            await loadJS("https://cdn.amcharts.com/lib/5/themes/Animated.js");
        });

        useEffect(() => {
            this.renderChart();
        }, () => [this.props.config]);

        onMounted(() => this.renderChart());

        onWillUnmount(() => {
            if (this.root) {
                this.root.dispose();
            }
        });
    }

    renderChart() {
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
            paddingRight: 1
        }));

        let cursor = chart.set("cursor", am5xy.XYCursor.new(this.root, {}));
        cursor.lineY.set("visible", false);

        let xRenderer = am5xy.AxisRendererX.new(this.root, {
            minGridDistance: 30,
            minorGridEnabled: true
        });

        xRenderer.labels.template.setAll({
            ellipsis: true,
            wrap: true,
            maxWidth: 160,
            oversizedBehavior: "wrap",
            textAlign: "center",
        });

        xRenderer.grid.template.setAll({
            location: 1
        });

        let xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(this.root, {
            maxDeviation: 0.3,
            categoryField: this.props.config.label_category,
            renderer: xRenderer,
            tooltip: am5.Tooltip.new(this.root, {})
        }));

        let yRenderer = am5xy.AxisRendererY.new(this.root, {
            strokeOpacity: 0.1
        });

        let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(this.root, {
            maxDeviation: 0.3,
            renderer: yRenderer
        }));

        let series = chart.series.push(am5xy.ColumnSeries.new(this.root, {
            name: "Series 1",
            xAxis: xAxis,
            yAxis: yAxis,
            valueYField: this.props.config.label_value,
            sequencedInterpolation: true,
            categoryXField: this.props.config.label_category,
            tooltip: am5.Tooltip.new(this.root, {
                labelText: "{valueY}"
            })
        }));

        series.columns.template.setAll({ cornerRadiusTL: 5, cornerRadiusTR: 5, strokeOpacity: 0 });
        series.columns.template.adapters.add("fill", function (fill, target) {
            return chart.get("colors").getIndex(series.columns.indexOf(target));
        });

        series.columns.template.adapters.add("stroke", function (stroke, target) {
            return chart.get("colors").getIndex(series.columns.indexOf(target));
        });

        let data = this.props.config.data;

        xAxis.data.setAll(data);
        series.data.setAll(data);

        series.appear(1000);
        chart.appear(1000, 100);
    }
}

ColumnChart.template = "owl_dashboard.ColumnChart";
