/** @odoo-module */

import { registry } from "@web/core/registry";
import { loadJS } from "@web/core/assets";
const { Component, onWillStart, useRef, onMounted, useEffect, onWillUnmount } = owl;

export class SankeyDiagram extends Component {
    setup() {
        this.chartRef = useRef("chart");
        this.root = null;

        onWillStart(async () => {
            await loadJS("https://cdn.amcharts.com/lib/5/index.js");
            await loadJS("https://cdn.amcharts.com/lib/5/flow.js");
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
            this.root.dispose();
        }

        this.root = am5.Root.new(this.chartRef.el);

        this.root.setThemes([
            am5themes_Animated.new(this.root)
        ]);

        let series = this.root.container.children.push(am5flow.Sankey.new(this.root, {
            sourceIdField: "from",
            targetIdField: "to",
            valueField: "value",
            paddingRight: 80
        }));

        series.nodes.get("colors").set("step", 2);

        // Set data from props
        let data = this.props.config.data;
        series.data.setAll(data);

        // Make stuff animate on load
        series.appear(1000, 100);
    }
}

SankeyDiagram.template = "owl_dashboard.SankeyDiagram";
