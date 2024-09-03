# -*- coding: utf-8 -*-
{
    'name' : 'Owl Dashboard',
    'version' : '1.0',
    'summary': 'OWL Dashboard',
    'sequence': -1,
    'description': """OWL Dashboard Custom Dashboard""",
    'author': "Nurosoft",
    'website': "https://www.nurosoft.id/",
    'category': 'OWL',
    'depends' : ['base', 'web', 'sale', 'board'],
    'data': [
        'views/owl_dashboard.xml',
    ],
    'demo': [
    ],
    'installable': True,
    'application': True,
    'assets': {
        'web.assets_backend': [
            # 'owl_dashboard/static/src/custom_dashboard_style.scss',
            'owl_dashboard/static/src/components/**/*.scss',
            'owl_dashboard/static/src/components/**/*.js',
            'owl_dashboard/static/src/components/**/*.xml',
            'https://cdn.amcharts.com/lib/5/index.js',
            'https://cdn.amcharts.com/lib/5/xy.js',
            'https://cdn.amcharts.com/lib/5/themes/Animated.js',
        ],
    },
    
}
