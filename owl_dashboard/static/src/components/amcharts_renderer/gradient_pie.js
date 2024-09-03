/** @odoo-module */

import { registry } from "@web/core/registry";
import { loadJS } from "@web/core/assets";
const { Component, onWillStart, useRef, onMounted, useEffect, onWillUnmount } = owl;

export class GradientPie extends Component {
    setup() {
        this.chartRef = useRef("chart");
        this.root = null;

        onWillStart(async () => {
            await loadJS("https://cdn.amcharts.com/lib/5/index.js");
            await loadJS("https://cdn.amcharts.com/lib/5/percent.js");
            await loadJS("https://cdn.amcharts.com/lib/5/themes/Animated.js");
        });

        useEffect(() => {
            this.renderChart();
        }, () => [this.props.config]);

        onMounted(() => this.renderChart());

        onWillUnmount(() => {
            if (this.root) {
                this.root.dispose();
                this.root = null;
            }
        });
    }

    renderChart() {
        if (this.root) {
            this.root.dispose();  // Dispose of the previous root
        }

        this.root = am5.Root.new(this.chartRef.el);

        this.root.setThemes([
            am5themes_Animated.new(this.root)
        ]);

        let chart = this.root.container.children.push(
            am5percent.PieChart.new(this.root, {
                endAngle: 270,
                layout: this.root.verticalLayout,
                innerRadius: am5.percent(60)
            })
        );

        let series = chart.series.push(
            am5percent.PieSeries.new(this.root, {
                valueField: this.props.config.label_value,
                categoryField: this.props.config.label_category,
                endAngle: 270,
                alignLabels: false,
                maxWidth: 80, // Adjust the width as needed
                wrap: true,
                textAlign: "center",
            })
        );

        series.set("colors", am5.ColorSet.new(this.root, {
            colors: [
                am5.color(0x73556E),
                am5.color(0x9FA1A6),
                am5.color(0xF2AA6B),
                am5.color(0xF28F6B),
                am5.color(0xA95A52),
                am5.color(0xE35B5D),
                am5.color(0xFFA446)
            ]
        }));

        let gradient = am5.RadialGradient.new(this.root, {
            stops: [
                { color: am5.color(0x000000) },
                { color: am5.color(0x000000) },
                {}
            ]
        });

        series.slices.template.setAll({
            fillGradient: gradient,
            strokeWidth: 2,
            stroke: am5.color(0xffffff),
            cornerRadius: 10,
            shadowOpacity: 0.1,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            shadowColor: am5.color(0x000000),
            fillPattern: am5.GrainPattern.new(this.root, {
                maxOpacity: 0.2,
                density: 0.5,
                colors: [am5.color(0x000000)]
            }),
            maxWidth: 80, // Adjust the width as needed
            wrap: true,
            textAlign: "center",
        });

        series.slices.template.states.create("hover", {
            shadowOpacity: 1,
            shadowBlur: 10
        });

        series.ticks.template.setAll({
            strokeOpacity: 0.4,
            strokeDasharray: [2, 2]
        });

        series.states.create("hidden", {
            endAngle: -90
        });

        // Set data from props
        let data = this.props.config.data;
        series.data.setAll(data);

        let legend = chart.children.push(am5.Legend.new(this.root, {
            centerX: am5.percent(50),
            x: am5.percent(50),
            marginTop: 15,
            marginBottom: 15,
        }));

        legend.markerRectangles.template.adapters.add("fillGradient", function () {
            return undefined;
        });

        legend.data.setAll(series.dataItems);

        // Set maxWidth for labels
        series.labels.template.setAll({
            maxWidth: 80, // Adjust the width as needed
            wrap: true,
            textAlign: "center",
            // textType: "circular",
        });

        series.appear(1000, 100);
    }
}

GradientPie.template = "owl_dashboard.GradientPie";
