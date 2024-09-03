/** @odoo-module */

import { registry } from "@web/core/registry"
import { KpiCard } from "./kpi_card/kpi_card"
import { ColumnChart } from "./amcharts_renderer/column_chart"
import { loadJS } from "@web/core/assets"
import { useService } from "@web/core/utils/hooks"
import { GradientPie } from "./amcharts_renderer/gradient_pie"
import { SankeyDiagram } from "./amcharts_renderer/sankey_diagram"
import { DateChart } from "./amcharts_renderer/date_chart"
const { Component, onWillStart, useRef, onMounted, useState } = owl

export class OwlMainDashboard extends Component {
    // fetch_sales_history.js

    async getSalesHistory() {
        let domain = [];

        if (this.state.period > 0) {
            domain.push(['date_order', '>', this.state.current_date]);
        }

        // Fetching sale orders with their amounts and dates
        const data = await this.orm.readGroup("sale.order", domain, ['amount_total', 'date_order'], ['date_order'], { orderby: "date_order asc" });

        // Preparing data for the chart
        this.state.salesHistory = {
            data: data.map(d => ({
                date: d.date_order,  // Using date from 'date_order'
                value: d.amount_total // Using total amount from 'amount_total'
            })),
            domain,
            label_category: 'date',
            label_value: 'value',
        };
    }

    async getSankeyData() {
        // Mendapatkan semua Quotations dari sale.order
        let quotations = await this.orm.readGroup(
            'sale.order',
            [],
            ['id'], // Menghitung jumlah Quotation berdasarkan ID
            ['id']
        );

        // Mendapatkan Orders dari sale.order dengan state bukan 'draft', 'sent', atau 'cancel'
        let orders = await this.orm.readGroup(
            'sale.order',
            [['state', 'not in', ['draft', 'sent', 'cancel']]],
            ['id'], // Menghitung jumlah Order berdasarkan ID
            ['id']
        );

        // Mendapatkan semua Invoices dari account.move dengan move_type 'out_invoice'
        let invoices = await this.orm.readGroup(
            'account.move',
            [['move_type', '=', 'out_invoice']],
            ['id'], // Menghitung jumlah Invoice berdasarkan ID
            ['id']
        );

        // Mendapatkan semua Payments dari account.payment tanpa filter domain
        let payments = await this.orm.readGroup(
            'account.payment',
            [],
            ['id'], // Menghitung jumlah Payment berdasarkan ID
            ['id']
        );

        // Menghitung jumlah (count) dari setiap kategori
        let totalQuotations = quotations.length;
        let totalOrders = orders.length;
        let totalInvoices = invoices.length;
        let totalPayments = payments.length;

        let data = [
            { from: "Quotations", to: "Not Orders", value: totalQuotations - totalOrders },
            { from: "Quotations", to: "Orders", value: totalOrders },
            { from: "Orders", to: "Not Invoiced", value: totalOrders - totalInvoices },
            { from: "Orders", to: "Invoices", value: totalInvoices },
            { from: "Invoices", to: "Not Paid", value: totalInvoices - totalPayments },
            { from: "Invoices", to: "Payments", value: totalPayments }
        ];

        this.state.sankeyData = { data: data };
    }




    // top products
    async getTopProducts() {
        let domain = [['state', 'in', ['sale', 'done']]]
        if (this.state.period > 0) {
            domain.push(['date', '>', this.state.current_date])
        }

        const data = await this.orm.readGroup("sale.report", domain, ['product_id', 'price_total'], ['product_id'], { limit: 5, orderby: "price_total desc" })

        this.state.topProducts = {
            data:
                data.map(d => ({
                    product_id: d.product_id[1],  // Menggunakan nama produk dari 'product_id'
                    total_price: d.price_total // Menggunakan nilai dari 'price_total'
                })
                ),
            domain,
            label_category: 'product_id',
            label_value: 'total_price',
        }
    }

    // top sales people
    async getTopSalesPeople() {
        let domain = [['state', 'in', ['sale', 'done']]]
        if (this.state.period > 0) {
            domain.push(['date', '>', this.state.current_date])
        }

        const data = await this.orm.readGroup("sale.report", domain, ['user_id', 'price_total'], ['user_id'], { limit: 5, orderby: "price_total desc" })

        this.state.topSalesPeople = {
            data: {
                labels: data.map(d => d.user_id[1]),
                datasets: [
                    {
                        label: 'Total',
                        data: data.map(d => d.price_total),
                        hoverOffset: 4,
                        // backgroundColor: data.map((_, index) => getColor(index)),
                    }]
            },
            domain,
            label_field: 'user_id',
        }
    }

    // monthly sales
    async getMonthlySales() {
        let domain = [['state', 'in', ['draft', 'sent', 'sale', 'done']]]
        if (this.state.period > 0) {
            domain.push(['date', '>', this.state.current_date])
        }

        const data = await this.orm.readGroup("sale.report", domain, ['date', 'state', 'price_total'], ['date', 'state'], { orderby: "date", lazy: false })
        console.log("monthly sales", data)

        const labels = [... new Set(data.map(d => d.date))]
        const quotations = data.filter(d => d.state == 'draft' || d.state == 'sent')
        const orders = data.filter(d => ['sale', 'done'].includes(d.state))

        this.state.monthlySales = {
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Quotations',
                        data: labels.map(l => quotations.filter(q => l == q.date).map(j => j.price_total).reduce((a, c) => a + c, 0)),
                        hoverOffset: 4,
                        backgroundColor: "red",
                    }, {
                        label: 'Orders',
                        data: labels.map(l => orders.filter(q => l == q.date).map(j => j.price_total).reduce((a, c) => a + c, 0)),
                        hoverOffset: 4,
                        backgroundColor: "green",
                    }]
            },
            domain,
            label_field: 'date',
        }
    }

    // partner orders
    async getPartnerOrders() {
        let domain = [['state', 'in', ['draft', 'sent', 'sale', 'done']]]
        if (this.state.period > 0) {
            domain.push(['date', '>', this.state.current_date])
        }

        const data = await this.orm.readGroup("sale.report", domain, ['partner_id', 'price_total', 'product_uom_qty'], ['partner_id'], { orderby: "partner_id", lazy: false })
        console.log(data)

        this.state.partnerOrders = {
            data: {
                labels: data.map(d => d.partner_id[1]),
                datasets: [
                    {
                        label: 'Total Amount',
                        data: data.map(d => d.price_total),
                        hoverOffset: 4,
                        backgroundColor: "orange",
                        yAxisID: 'Total',
                        order: 1,
                    }, {
                        label: 'Ordered Qty',
                        data: data.map(d => d.product_uom_qty),
                        hoverOffset: 4,
                        //backgroundColor: "blue",
                        type: "line",
                        borderColor: "blue",
                        yAxisID: 'Qty',
                        order: 0,
                    }]
            },
            scales: {
                /*Qty: {
                    position: 'right',
                }*/
                yAxes: [
                    { id: 'Qty', position: 'right' },
                    { id: 'Total', position: 'left' },
                ]
            },
            domain,
            label_field: 'partner_id',
        }
    }

    setup() {
        this.state = useState({
            quotations: {
                value: 10,
                percentage: 6,
                period: 0,
            },
            period: 0,
        })
        this.orm = useService("orm")
        this.actionService = useService("action")

        onWillStart(async () => {
            await loadJS("https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js")
            this.getDates()
            await this.getQuotations()
            await this.getOrders()

            await this.getSalesHistory()
            await this.getSankeyData()
            await this.getTopProducts()
            await this.getTopSalesPeople()
            await this.getMonthlySales()
            await this.getPartnerOrders()
        })
    }

    async onChangePeriod() {
        this.getDates()
        await this.getQuotations()
        await this.getOrders()

        await this.getSalesHistory()
        await this.getSankeyData()
        await this.getTopProducts()
        await this.getTopSalesPeople()
        await this.getMonthlySales()
        await this.getPartnerOrders()
    }

    getDates() {
        this.state.current_date = moment().subtract(this.state.period, 'days').format('YYYY-MM-DD')
        this.state.previous_date = moment().subtract(this.state.period * 2, 'days').format('YYYY-MM-DD')
    }

    async getQuotations() {
        let domain = [['state', 'in', ['sent', 'draft']]]
        if (this.state.period > 0) {
            domain.push(['date_order', '>', this.state.current_date])
        }
        const data = await this.orm.searchCount("sale.order", domain)
        this.state.quotations.value = data
        
        // previous period
        let prev_domain = [['state', 'in', ['sent', 'draft']]]
        if (this.state.period > 0) {
            prev_domain.push(['date_order', '>', this.state.previous_date], ['date_order', '<=', this.state.current_date])
        }
        const prev_data = await this.orm.searchCount("sale.order", prev_domain)
        const percentage = ((data - prev_data) / prev_data) * 100
        const period = this.state.period
        this.state.quotations.period = period
        this.state.quotations.percentage = percentage.toFixed(2)
    }

    async getOrders() {
        let domain = [['state', 'in', ['sale', 'done']]];
        if (this.state.period > 0) {
            domain.push(['date_order', '>', this.state.current_date]);
        }
        const data = await this.orm.searchCount("sale.order", domain);

        // previous period
        let prev_domain = [['state', 'in', ['sale', 'done']]];
        if (this.state.period > 0) {
            prev_domain.push(['date_order', '>', this.state.previous_date], ['date_order', '<=', this.state.current_date]);
        }
        const prev_data = await this.orm.searchCount("sale.order", prev_domain);
        const percentage = ((data - prev_data) / prev_data) * 100;
        const period = this.state.period;

        // revenues
        const current_revenue = await this.orm.readGroup("sale.order", domain, ["amount_total:sum"], []);
        const prev_revenue = await this.orm.readGroup("sale.order", prev_domain, ["amount_total:sum"], []);
        const revenue_percentage = ((current_revenue[0].amount_total - prev_revenue[0].amount_total) / prev_revenue[0].amount_total) * 100;

        // average
        const current_average = await this.orm.readGroup("sale.order", domain, ["amount_total:avg"], []);
        const prev_average = await this.orm.readGroup("sale.order", prev_domain, ["amount_total:avg"], []);
        const average_percentage = ((current_average[0].amount_total - prev_average[0].amount_total) / prev_average[0].amount_total) * 100;

        this.state.orders = {
            value: data,
            percentage: percentage.toFixed(2),
            revenue: `$${(current_revenue[0].amount_total / 1000).toFixed(2)}K`,
            revenue_percentage: revenue_percentage.toFixed(2),
            average: `$${(current_average[0].amount_total / 1000).toFixed(2)}K`,
            average_percentage: average_percentage.toFixed(2),
            period: period,
        };
    }

    async viewQuotations(){
        let domain = [['state', 'in', ['sent', 'draft']]]
        if (this.state.period > 0) {
            domain.push(['date_order', '>', this.state.current_date])
        }

        let list_view = await this.orm.searchRead("ir.model.data", [['name', '=', 'view_quotation_tree_with_onboarding']], ['res_id'])

        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: "Quotations",
            res_model: "sale.order",
            domain,
            views: [
                [list_view.length > 0 ? list_view[0].res_id : false, "list"],
                [false, "form"],
            ]
        })
    }

    viewOrders(){
        let domain = [['state', 'in', ['sale', 'done']]]
        if (this.state.period > 0) {
            domain.push(['date_order', '>', this.state.current_date])
        }

        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: "Quotations",
            res_model: "sale.order",
            domain,
            context: { group_by: ['date_order'] },
            views: [
                [false, "list"],
                [false, "form"],
            ]
        })
    }

    viewRevenues(){
        let domain = [['state', 'in', ['sale', 'done']]]
        if (this.state.period > 0) {
            domain.push(['date_order', '>', this.state.current_date])
        }

        this.actionService.doAction({
            type: "ir.actions.act_window",
            name: "Quotations",
            res_model: "sale.order",
            domain,
            context: { group_by: ['date_order'] },
            views: [
                [false, "pivot"],
                [false, "form"],
            ]
        })
    }
}

OwlMainDashboard.template = "owl_dashboard.OwlMainDashboard"
OwlMainDashboard.components = { KpiCard, ColumnChart, GradientPie, SankeyDiagram, DateChart }

registry.category("actions").add("owl_dashboard.main_dashboard", OwlMainDashboard)