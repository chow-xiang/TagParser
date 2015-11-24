/****
author: chow xiang
version: 0.1.0
next version: Event Mechanism [事件机制]
			  data support function

*/ 

define( function( require ) {

	/*注册表 - 就是已经导入过的component*/
	var REGISTER_LIST = {}; 

	/*所有的方法库*/
	var TOOLS = {
		/*html parser*/ 
		parseDomFromHtmlString: function ( _domString, _oldChildrenString ){
			/*替换的准备*/
			var tempDom = document.createElement('div');
				tempDom.innerHTML = _domString;
			/*替换的dom*/
			var result  = tempDom.childNodes;

			/*模板必须要有一个根dom，如果出来是个数组，报错*/ 
			if( result.length > 1 ){
				errorTip( '模板必须有个根dom，fuck off！！！' );
			}

			/*将原来的子dom添加进去*/ 
			result = result[0];
			result.innerHTML += _oldChildrenString;

			return result;
		},
		/*深度复制下data*/
		copyData: function ( obj ){
			for( var key in obj ){
				this[ key ] = obj[ key ];
			}
		},
		/*给老子把自定义的子组件扒出来，艹*/
		findCustomChild: function( _dom, components ){

			/*把目前所有的子元素扫描一遍*/ 
			var _childs = TOOLS.allChildDom( _dom );

			for( var i=0;i<_childs.length;i++ ){

				+function(i){
					var _parserModel = TOOLS.childIsComponent( _childs[i], components );
					/*如果是子组件*/ 
					if( _parserModel ){
						new Parser( _parserModel, _dom )
					}
				}(i)

			}

		},
		allChildDom: function (element){
		    var result = [];
		    var walker = document.createTreeWalker(element, NodeFilter.SHOW_ELEMENT, null, false);
		    var node = walker.nextNode();
		    while(node){
		        result.push(node);
		        node = walker.nextNode();
		    }
		    return result;
		},
		/*判定子元素是否是组件*/
		childIsComponent: function ( _dom, components ){

			var _tagName = _dom.nodeName.toLowerCase() || ( _dom.nodeName.toLowerCase() == 'component' && _dom.getAttribute('is') ) || '';
			/*如果子元素直接是*/
			return components && components[ _tagName ];
			
		}
	}

	
	

	

	


	/*Factory to custom virtual dom class*/
	function TagFactory( _parserModel ){

		return !!REGISTER_LIST[ _parserModel.name ] ? REGISTER_LIST[ _parserModel.name ] : (function( _parserModel ){

			var parseDomFromHtmlString = TOOLS.parseDomFromHtmlString;
			var copyData = TOOLS.copyData;
			var childIsComponent = TOOLS.childIsComponent;
			var findCustomChild = TOOLS.findCustomChild;



			var _methods = _parserModel.methods,
				_datas = _parserModel.data;

			/*绑定data*/
			var Tag = function( _dom ){

				/*  防止指针变量的问题*/
				this.data = new copyData( typeof _datas == 'function' ? _datas() : _datas );
				/*渲染*/ 
				this.render( _dom );
			};

			/*绑定Tag的method*/
			Tag.prototype = _methods || {};

			/*绑定components*/ 
			Tag.prototype.components = _parserModel.components || {};
			
			/*绑定接口*/
			Tag.prototype.beforeReady = _parserModel.beforeReady;
			Tag.prototype.ready = _parserModel.ready;
			Tag.prototype.render = function( _dom ){

				/*绑定props*/ 
				this.props = {};
				var propsMapping =  _dom.attributes;
				/*提取props*/
				for( var i=0;i<propsMapping.length;i++ ){
					this.props[ propsMapping[i].name ] = propsMapping[i].value;
				}
				
				var _newInnerHTML = _parserModel.render.bind( this )( this.props, this.data );
				var _oldInnerHTML = _dom.innerHTML;
				/*绑定$el*/ 
				this.$el = parseDomFromHtmlString( _newInnerHTML, _oldInnerHTML );

				/*替换virtual dom之前*/ 
				this.beforeReady && this.beforeReady();

				/*替换virtual dom*/
				_dom.parentNode.replaceChild( this.$el, _dom );


				/*关于子virtual dom*/
				findCustomChild( this.$el, _parserModel.components );


				/*绑定$refs*/
				this.$refs = {};
				var _allChildRefs = this.$el.querySelectorAll('[ref]');
				for( var i=0;i<_allChildRefs.length;i++ ){
					this.$refs[ _allChildRefs[i].getAttribute('ref') ] = _allChildRefs[i];
				}

				/*替换virtual dom之后*/ 
				this.ready && this.ready();
			}


			/*注册表注册下*/ 
			REGISTER_LIST[ _parserModel.name ] = Tag;

			return Tag;

		})( _parserModel );

	}


	/*virtual dom parser*/ 
	var Parser = function( _parserModel, _rootDom ){
		this.init( _parserModel, _rootDom );
	}

	Parser.prototype = {
		/*初始化*/ 
		init: function( _parserModel, _rootDom ){

			!!_rootDom || ( _rootDom = document );

			/*生成Tag class*/ 
			var Tag = TagFactory( _parserModel );

			/*virtual dom*/ 
			var _doms = _rootDom.getElementsByTagName( _parserModel.name );

			/*替换*/ 
			this.render( _doms, Tag );
		},
		/*渲染的工作*/ 
		render: function( _doms, Tag ){
			while( _doms.length ){
				new Tag( _doms[0] );
			}
		}
	}


	function errorTip( string ){
		console.error( '模板必须有个根dom，fuck off！' );
	}
	
	return {
		register: function( /*Object*/ _parserModel ){
			/*查看是否是数组？*/ 
			return new Parser( _parserModel );

		}
	}

} )